// Anthropic Provider
import Anthropic from "@anthropic-ai/sdk";

import {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
  AIStreamChunk,
  DEFAULT_MODELS,
  TOKEN_LIMITS,
} from "./types";

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",

  isConfigured: () => {
    return !!process.env.ANTHROPIC_API_KEY;
  },

  complete: async (options: AICompletionOptions): Promise<AICompletionResult> => {
    const client = getClient();
    const model = options.model || DEFAULT_MODELS.anthropic;

    // Separate system message from conversation
    const systemMessage = options.messages.find((m) => m.role === "system");
    const conversationMessages = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens || TOKEN_LIMITS.maxCompletion,
      system: systemMessage?.content || undefined,
      messages: conversationMessages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Anthropic");
    }

    return {
      content: textContent.text,
      tokensUsed: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
      provider: "anthropic",
    };
  },

  stream: async function* (options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
    const client = getClient();
    const model = options.model || DEFAULT_MODELS.anthropic;

    try {
      // Separate system message from conversation
      const systemMessage = options.messages.find((m) => m.role === "system");
      const conversationMessages = options.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const stream = await client.messages.stream({
        model,
        max_tokens: options.maxTokens || TOKEN_LIMITS.maxCompletion,
        system: systemMessage?.content || undefined,
        messages: conversationMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "content", content: event.delta.text };
        }

        if (event.type === "message_delta" && event.usage) {
          yield {
            type: "done",
            tokensUsed: {
              prompt: 0, // Not available in delta
              completion: event.usage.output_tokens,
              total: event.usage.output_tokens,
            },
          };
        }
      }

      // Get final message for complete usage
      const finalMessage = await stream.finalMessage();
      yield {
        type: "done",
        tokensUsed: {
          prompt: finalMessage.usage.input_tokens,
          completion: finalMessage.usage.output_tokens,
          total: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
        },
      };
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown Anthropic error",
      };
    }
  },
};
