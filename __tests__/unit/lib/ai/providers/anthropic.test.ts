/**
 * Anthropic Provider Tests
 * Tests for lib/ai/providers/anthropic.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Anthropic module
vi.mock("@anthropic-ai/sdk", () => {
  const mockMessagesCreate = vi.fn();
  const mockMessagesStream = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
        stream: mockMessagesStream,
      },
    })),
    __mockMessagesCreate: mockMessagesCreate,
    __mockMessagesStream: mockMessagesStream,
  };
});

describe("Anthropic Provider", () => {
  const originalEnv = process.env;
  let mockMessagesCreate: ReturnType<typeof vi.fn>;
  let mockMessagesStream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Get the mock functions
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mocks = require("@anthropic-ai/sdk");
    mockMessagesCreate = mocks.__mockMessagesCreate;
    mockMessagesStream = mocks.__mockMessagesStream;
    mockMessagesCreate.mockReset();
    mockMessagesStream.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("isConfigured", () => {
    it("returns true when ANTHROPIC_API_KEY is set", async () => {
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      expect(anthropicProvider.isConfigured()).toBe(true);
    });

    it("returns false when ANTHROPIC_API_KEY is not set", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      expect(anthropicProvider.isConfigured()).toBe(false);
    });

    it("returns false when ANTHROPIC_API_KEY is empty string", async () => {
      process.env.ANTHROPIC_API_KEY = "";
      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      expect(anthropicProvider.isConfigured()).toBe(false);
    });
  });

  describe("complete", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    });

    it("separates system message from conversation messages", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Hello!" }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await anthropicProvider.complete({
        messages: [
          { role: "system" as const, content: "You are helpful" },
          { role: "user" as const, content: "Hello" },
          { role: "assistant" as const, content: "Hi there" },
          { role: "user" as const, content: "How are you?" },
        ],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: "claude-3-5-sonnet-20241022", // default model
        max_tokens: 1000,
        system: "You are helpful",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
          { role: "user", content: "How are you?" },
        ],
      });
    });

    it("handles messages without system message", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Response" }],
        usage: { input_tokens: 5, output_tokens: 3 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: undefined,
          messages: [{ role: "user", content: "Hi" }],
        })
      );
    });

    it("uses custom model when provided", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Response" }],
        usage: { input_tokens: 5, output_tokens: 3 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await anthropicProvider.complete({
        model: "claude-3-opus-20240229",
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: "claude-3-opus-20240229" })
      );
    });

    it("uses custom maxTokens when provided", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Response" }],
        usage: { input_tokens: 5, output_tokens: 3 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
        maxTokens: 2000,
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 2000 })
      );
    });

    it("returns completion result with calculated token usage", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Hello! How can I help?" }],
        usage: { input_tokens: 15, output_tokens: 8 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const result = await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hello" }],
      });

      expect(result).toEqual({
        content: "Hello! How can I help?",
        tokensUsed: {
          prompt: 15,
          completion: 8,
          total: 23, // input + output
        },
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });
    });

    it("throws error when response has no text content", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "123", name: "test", input: {} }],
        usage: { input_tokens: 5, output_tokens: 3 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await expect(
        anthropicProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("No text response from Anthropic");
    });

    it("throws error when content array is empty", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [],
        usage: { input_tokens: 5, output_tokens: 0 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await expect(
        anthropicProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("No text response from Anthropic");
    });

    it("propagates API errors", async () => {
      mockMessagesCreate.mockRejectedValue(new Error("Authentication failed"));

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await expect(
        anthropicProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("Authentication failed");
    });

    it("finds text content among mixed content types", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [
          { type: "thinking", thinking: "Let me think..." },
          { type: "text", text: "Here is my response" },
        ],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const result = await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(result.content).toBe("Here is my response");
    });
  });

  describe("stream", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    });

    it("streams content chunks correctly", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 10, output_tokens: 8 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: " there" } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "!" } };
          yield { type: "message_delta", usage: { output_tokens: 8 } };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const chunks: Array<{ type: string; content?: string }> = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      // Should have 3 content chunks, 1 intermediate done, and 1 final done
      expect(chunks).toContainEqual({ type: "content", content: "Hello" });
      expect(chunks).toContainEqual({ type: "content", content: " there" });
      expect(chunks).toContainEqual({ type: "content", content: "!" });
    });

    it("separates system message for streaming", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hi" } };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      // Consume the stream
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of anthropicProvider.stream({
        messages: [
          { role: "system" as const, content: "Be helpful" },
          { role: "user" as const, content: "Hi" },
        ],
      })) {
        // consume
      }

      expect(mockMessagesStream).toHaveBeenCalledWith({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: "Be helpful",
        messages: [{ role: "user", content: "Hi" }],
      });
    });

    it("ignores non-text_delta events", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 5, output_tokens: 2 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "message_start", message: {} };
          yield { type: "content_block_start", content_block: { type: "text" } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } };
          yield { type: "content_block_delta", delta: { type: "input_json_delta", partial_json: "{}" } };
          yield { type: "content_block_stop" };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const contentChunks = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        if (chunk.type === "content") {
          contentChunks.push(chunk);
        }
      }

      expect(contentChunks).toEqual([{ type: "content", content: "Hello" }]);
    });

    it("yields intermediate done chunk on message_delta with usage", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hi" } };
          yield { type: "message_delta", usage: { output_tokens: 5 } };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const chunks = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      // Find intermediate done chunk
      const intermediateDone = chunks.find(
        (c) => c.type === "done" && c.tokensUsed?.prompt === 0
      );
      expect(intermediateDone).toEqual({
        type: "done",
        tokensUsed: { prompt: 0, completion: 5, total: 5 },
      });
    });

    it("yields final done chunk with complete usage", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hi" } };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const chunks = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      // Last chunk should be final done with complete usage
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk).toEqual({
        type: "done",
        tokensUsed: { prompt: 10, completion: 5, total: 15 },
      });
    });

    it("yields error chunk on stream failure", async () => {
      mockMessagesStream.mockRejectedValue(new Error("Stream error"));

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const chunks = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([{ type: "error", error: "Stream error" }]);
    });

    it("handles non-Error thrown objects", async () => {
      mockMessagesStream.mockRejectedValue("Unknown failure");

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      const chunks = [];
      for await (const chunk of anthropicProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([{ type: "error", error: "Unknown Anthropic error" }]);
    });

    it("uses custom model and maxTokens for streaming", async () => {
      const mockFinalMessage = vi.fn().mockResolvedValue({
        usage: { input_tokens: 5, output_tokens: 2 },
      });

      const mockStreamIterable = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hi" } };
        },
        finalMessage: mockFinalMessage,
      };
      mockMessagesStream.mockResolvedValue(mockStreamIterable);

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      // Consume the stream
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of anthropicProvider.stream({
        model: "claude-3-opus-20240229",
        messages: [{ role: "user" as const, content: "Hi" }],
        maxTokens: 2000,
      })) {
        // consume
      }

      expect(mockMessagesStream).toHaveBeenCalledWith({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        system: undefined,
        messages: [{ role: "user", content: "Hi" }],
      });
    });
  });

  describe("client initialization", () => {
    it("creates client with API key from environment", async () => {
      const Anthropic = await import("@anthropic-ai/sdk");
      process.env.ANTHROPIC_API_KEY = "test-api-key-456";

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Hi" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");
      await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(Anthropic.default).toHaveBeenCalledWith({
        apiKey: "test-api-key-456",
      });
    });

    it("reuses client instance across calls", async () => {
      const Anthropic = await import("@anthropic-ai/sdk");
      process.env.ANTHROPIC_API_KEY = "test-key";

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Hi" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });
      await anthropicProvider.complete({
        messages: [{ role: "user" as const, content: "Hi again" }],
      });

      // Client should only be created once
      expect(Anthropic.default).toHaveBeenCalledTimes(1);
    });
  });

  describe("provider metadata", () => {
    it("has correct provider name", async () => {
      process.env.ANTHROPIC_API_KEY = "test-key";
      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic");

      expect(anthropicProvider.name).toBe("anthropic");
    });
  });
});
