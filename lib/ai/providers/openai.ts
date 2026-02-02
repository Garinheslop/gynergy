// OpenAI Provider
import OpenAI from "openai";

import {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
  AIStreamChunk,
  DEFAULT_MODELS,
  TOKEN_LIMITS,
} from "./types";

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export const openaiProvider: AIProvider = {
  name: "openai",

  isConfigured: () => {
    return !!process.env.OPENAI_API_KEY;
  },

  complete: async (options: AICompletionOptions): Promise<AICompletionResult> => {
    const client = getClient();
    const model = options.model || DEFAULT_MODELS.openai;

    const response = await client.chat.completions.create({
      model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || TOKEN_LIMITS.maxCompletion,
      temperature: options.temperature ?? 0.8,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No response content from OpenAI");
    }

    return {
      content: choice.message.content,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      model,
      provider: "openai",
    };
  },

  stream: async function* (options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
    const client = getClient();
    const model = options.model || DEFAULT_MODELS.openai;

    try {
      const stream = await client.chat.completions.create({
        model,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: options.maxTokens || TOKEN_LIMITS.maxCompletion,
        temperature: options.temperature ?? 0.8,
        stream: true,
        stream_options: { include_usage: true },
      });

      let totalContent = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          totalContent += delta;
          yield { type: "content", content: delta };
        }

        // Check for usage in final chunk
        if (chunk.usage) {
          yield {
            type: "done",
            tokensUsed: {
              prompt: chunk.usage.prompt_tokens,
              completion: chunk.usage.completion_tokens,
              total: chunk.usage.total_tokens,
            },
          };
          return;
        }
      }

      // If we didn't get usage data, estimate based on content
      yield {
        type: "done",
        tokensUsed: {
          prompt: 0,
          completion: Math.ceil(totalContent.length / 4),
          total: Math.ceil(totalContent.length / 4),
        },
      };
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown OpenAI error",
      };
    }
  },
};
