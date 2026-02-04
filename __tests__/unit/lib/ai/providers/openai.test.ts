/**
 * OpenAI Provider Tests
 * Tests for lib/ai/providers/openai.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Create mock at module level so it persists across resetModules
const mockCreate = vi.fn();
const MockOpenAI = vi.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

// Mock OpenAI module
vi.mock("openai", () => ({
  default: MockOpenAI,
}));

describe("OpenAI Provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockCreate.mockReset();
    MockOpenAI.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("isConfigured", () => {
    it("returns true when OPENAI_API_KEY is set", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const { openaiProvider } = await import("@lib/ai/providers/openai");

      expect(openaiProvider.isConfigured()).toBe(true);
    });

    it("returns false when OPENAI_API_KEY is not set", async () => {
      delete process.env.OPENAI_API_KEY;
      const { openaiProvider } = await import("@lib/ai/providers/openai");

      expect(openaiProvider.isConfigured()).toBe(false);
    });

    it("returns false when OPENAI_API_KEY is empty string", async () => {
      process.env.OPENAI_API_KEY = "";
      const { openaiProvider } = await import("@lib/ai/providers/openai");

      expect(openaiProvider.isConfigured()).toBe(false);
    });
  });

  describe("complete", () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = "test-openai-key";
    });

    it("makes API call with correct parameters", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Hello!" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const options = {
        messages: [
          { role: "system" as const, content: "You are helpful" },
          { role: "user" as const, content: "Hello" },
        ],
        maxTokens: 500,
        temperature: 0.7,
      };

      await openaiProvider.complete(options);

      expect(mockCreate).toHaveBeenCalledWith({
        model: "gpt-4o", // default model
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
    });

    it("uses custom model when provided", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await openaiProvider.complete({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-3.5-turbo" }));
    });

    it("uses default temperature of 0.8 when not provided", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.8 }));
    });

    it("allows temperature of 0 to be set", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
        temperature: 0,
      });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0 }));
    });

    it("uses default max_tokens from TOKEN_LIMITS when not provided", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 1000 }) // TOKEN_LIMITS.maxCompletion
      );
    });

    it("returns completion result with token usage", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Hello! How can I help?" } }],
        usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const result = await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hello" }],
      });

      expect(result).toEqual({
        content: "Hello! How can I help?",
        tokensUsed: {
          prompt: 10,
          completion: 8,
          total: 18,
        },
        model: "gpt-4o",
        provider: "openai",
      });
    });

    it("handles missing usage data gracefully", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Response" } }],
        usage: undefined,
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const result = await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(result.tokensUsed).toEqual({
        prompt: 0,
        completion: 0,
        total: 0,
      });
    });

    it("throws error when response has no content", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await expect(
        openaiProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("No response content from OpenAI");
    });

    it("throws error when choices array is empty", async () => {
      mockCreate.mockResolvedValue({
        choices: [],
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await expect(
        openaiProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("No response content from OpenAI");
    });

    it("propagates API errors", async () => {
      mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      await expect(
        openaiProvider.complete({
          messages: [{ role: "user" as const, content: "Hi" }],
        })
      ).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("stream", () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = "test-openai-key";
    });

    it("streams content chunks correctly", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "Hello" } }] };
          yield { choices: [{ delta: { content: " there" } }] };
          yield {
            choices: [{ delta: { content: "!" } }],
            usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
          };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const chunks: Array<{ type: string; content?: string }> = [];
      for await (const chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { type: "content", content: "Hello" },
        { type: "content", content: " there" },
        { type: "content", content: "!" },
        {
          type: "done",
          tokensUsed: { prompt: 5, completion: 3, total: 8 },
        },
      ]);
    });

    it("enables streaming in API call", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{ delta: { content: "Hi" } }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      // Consume the stream
      for await (const _chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        // consume
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
          stream_options: { include_usage: true },
        })
      );
    });

    it("skips chunks without delta content", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: {} }] }; // no content
          yield { choices: [{ delta: { content: "Hello" } }] };
          yield { choices: [{ delta: {} }] }; // empty delta
          yield {
            choices: [{ delta: {} }],
            usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
          };
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const chunks = [];
      for await (const chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { type: "content", content: "Hello" },
        { type: "done", tokensUsed: { prompt: 5, completion: 1, total: 6 } },
      ]);
    });

    it("estimates tokens when usage not provided", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: "Hello world" } }] };
          // No usage data in any chunk
        },
      };
      mockCreate.mockResolvedValue(mockStream);

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const chunks = [];
      for await (const chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      // Should have content chunk and estimated done chunk
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({ type: "content", content: "Hello world" });
      expect(chunks[1].type).toBe("done");
      // Estimated tokens: Math.ceil(11 / 4) = 3
      expect(chunks[1].tokensUsed?.completion).toBe(3);
    });

    it("yields error chunk on stream failure", async () => {
      mockCreate.mockRejectedValue(new Error("Stream connection failed"));

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const chunks = [];
      for await (const chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([{ type: "error", error: "Stream connection failed" }]);
    });

    it("handles non-Error thrown objects", async () => {
      mockCreate.mockRejectedValue("String error");

      const { openaiProvider } = await import("@lib/ai/providers/openai");

      const chunks = [];
      for await (const chunk of openaiProvider.stream({
        messages: [{ role: "user" as const, content: "Hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([{ type: "error", error: "Unknown OpenAI error" }]);
    });
  });

  describe("client initialization", () => {
    it("creates client with API key from environment", async () => {
      process.env.OPENAI_API_KEY = "test-api-key-123";

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const { openaiProvider } = await import("@lib/ai/providers/openai");
      await openaiProvider.complete({
        messages: [{ role: "user" as const, content: "Hi" }],
      });

      expect(MockOpenAI).toHaveBeenCalledWith({
        apiKey: "test-api-key-123",
      });
    });
  });

  describe("provider metadata", () => {
    it("has correct provider name", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const { openaiProvider } = await import("@lib/ai/providers/openai");

      expect(openaiProvider.name).toBe("openai");
    });
  });
});
