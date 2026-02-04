/**
 * AI Providers Index Tests
 * Tests for lib/ai/providers/index.ts - Fallback Logic
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Track which providers are configured and their behavior
let mockOpenAIConfigured = true;
let mockAnthropicConfigured = true;
let mockOpenAICompleteImpl: ReturnType<typeof vi.fn>;
let mockAnthropicCompleteImpl: ReturnType<typeof vi.fn>;
let mockOpenAIStreamImpl: ReturnType<typeof vi.fn>;
let mockAnthropicStreamImpl: ReturnType<typeof vi.fn>;

// Mock the provider modules
vi.mock("@lib/ai/providers/openai", () => ({
  openaiProvider: {
    name: "openai",
    isConfigured: () => mockOpenAIConfigured,
    complete: (...args: unknown[]) => mockOpenAICompleteImpl(...args),
    stream: (...args: unknown[]) => mockOpenAIStreamImpl(...args),
  },
}));

vi.mock("@lib/ai/providers/anthropic", () => ({
  anthropicProvider: {
    name: "anthropic",
    isConfigured: () => mockAnthropicConfigured,
    complete: (...args: unknown[]) => mockAnthropicCompleteImpl(...args),
    stream: (...args: unknown[]) => mockAnthropicStreamImpl(...args),
  },
}));

describe("AI Providers Index", () => {
  beforeEach(() => {
    vi.resetModules();
    mockOpenAIConfigured = true;
    mockAnthropicConfigured = true;
    mockOpenAICompleteImpl = vi.fn();
    mockAnthropicCompleteImpl = vi.fn();
    mockOpenAIStreamImpl = vi.fn();
    mockAnthropicStreamImpl = vi.fn();

    // Suppress console.warn during tests
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("getProvider", () => {
    it("returns openai provider when configured", async () => {
      mockOpenAIConfigured = true;
      const { getProvider } = await import("@lib/ai/providers");

      const provider = getProvider("openai");

      expect(provider).not.toBeNull();
      expect(provider?.name).toBe("openai");
    });

    it("returns anthropic provider when configured", async () => {
      mockAnthropicConfigured = true;
      const { getProvider } = await import("@lib/ai/providers");

      const provider = getProvider("anthropic");

      expect(provider).not.toBeNull();
      expect(provider?.name).toBe("anthropic");
    });

    it("returns null when openai not configured", async () => {
      mockOpenAIConfigured = false;
      const { getProvider } = await import("@lib/ai/providers");

      const provider = getProvider("openai");

      expect(provider).toBeNull();
    });

    it("returns null when anthropic not configured", async () => {
      mockAnthropicConfigured = false;
      const { getProvider } = await import("@lib/ai/providers");

      const provider = getProvider("anthropic");

      expect(provider).toBeNull();
    });
  });

  describe("isAIConfigured", () => {
    it("returns true when openai is configured", async () => {
      mockOpenAIConfigured = true;
      mockAnthropicConfigured = false;
      const { isAIConfigured } = await import("@lib/ai/providers");

      expect(isAIConfigured()).toBe(true);
    });

    it("returns true when anthropic is configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = true;
      const { isAIConfigured } = await import("@lib/ai/providers");

      expect(isAIConfigured()).toBe(true);
    });

    it("returns true when both are configured", async () => {
      mockOpenAIConfigured = true;
      mockAnthropicConfigured = true;
      const { isAIConfigured } = await import("@lib/ai/providers");

      expect(isAIConfigured()).toBe(true);
    });

    it("returns false when no providers configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = false;
      const { isAIConfigured } = await import("@lib/ai/providers");

      expect(isAIConfigured()).toBe(false);
    });
  });

  describe("getAvailableProviders", () => {
    it("returns both providers when both configured", async () => {
      mockOpenAIConfigured = true;
      mockAnthropicConfigured = true;
      const { getAvailableProviders } = await import("@lib/ai/providers");

      const providers = getAvailableProviders();

      expect(providers).toEqual(["openai", "anthropic"]);
    });

    it("returns only openai when anthropic not configured", async () => {
      mockOpenAIConfigured = true;
      mockAnthropicConfigured = false;
      const { getAvailableProviders } = await import("@lib/ai/providers");

      const providers = getAvailableProviders();

      expect(providers).toEqual(["openai"]);
    });

    it("returns only anthropic when openai not configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = true;
      const { getAvailableProviders } = await import("@lib/ai/providers");

      const providers = getAvailableProviders();

      expect(providers).toEqual(["anthropic"]);
    });

    it("returns empty array when no providers configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = false;
      const { getAvailableProviders } = await import("@lib/ai/providers");

      const providers = getAvailableProviders();

      expect(providers).toEqual([]);
    });
  });

  describe("complete", () => {
    const mockOptions = {
      messages: [{ role: "user" as const, content: "Hello" }],
    };

    it("uses preferred provider when specified and configured", async () => {
      mockOpenAICompleteImpl.mockResolvedValue({
        content: "OpenAI response",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "gpt-4o",
        provider: "openai",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions, "openai");

      expect(mockOpenAICompleteImpl).toHaveBeenCalledWith(mockOptions);
      expect(result.provider).toBe("openai");
    });

    it("uses anthropic when specified as preferred", async () => {
      mockAnthropicCompleteImpl.mockResolvedValue({
        content: "Anthropic response",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions, "anthropic");

      expect(mockAnthropicCompleteImpl).toHaveBeenCalledWith(mockOptions);
      expect(result.provider).toBe("anthropic");
    });

    it("falls back to openai when preferred provider fails", async () => {
      mockAnthropicCompleteImpl.mockRejectedValue(new Error("Anthropic down"));
      mockOpenAICompleteImpl.mockResolvedValue({
        content: "OpenAI fallback",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "gpt-4o",
        provider: "openai",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions, "anthropic");

      expect(mockAnthropicCompleteImpl).toHaveBeenCalled();
      expect(mockOpenAICompleteImpl).toHaveBeenCalled();
      expect(result.provider).toBe("openai");
      expect(console.warn).toHaveBeenCalled();
    });

    it("falls back to anthropic when preferred openai fails", async () => {
      mockOpenAICompleteImpl.mockRejectedValue(new Error("OpenAI down"));
      mockAnthropicCompleteImpl.mockResolvedValue({
        content: "Anthropic fallback",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions, "openai");

      expect(mockOpenAICompleteImpl).toHaveBeenCalled();
      expect(mockAnthropicCompleteImpl).toHaveBeenCalled();
      expect(result.provider).toBe("anthropic");
    });

    it("tries openai first when no preferred provider", async () => {
      mockOpenAICompleteImpl.mockResolvedValue({
        content: "OpenAI response",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "gpt-4o",
        provider: "openai",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions);

      expect(mockOpenAICompleteImpl).toHaveBeenCalled();
      expect(mockAnthropicCompleteImpl).not.toHaveBeenCalled();
      expect(result.provider).toBe("openai");
    });

    it("skips unconfigured providers", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicCompleteImpl.mockResolvedValue({
        content: "Anthropic response",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });

      const { complete } = await import("@lib/ai/providers");

      const result = await complete(mockOptions);

      expect(mockOpenAICompleteImpl).not.toHaveBeenCalled();
      expect(mockAnthropicCompleteImpl).toHaveBeenCalled();
      expect(result.provider).toBe("anthropic");
    });

    it("does not retry preferred provider in fallback loop", async () => {
      mockOpenAICompleteImpl.mockRejectedValue(new Error("OpenAI down"));
      mockAnthropicCompleteImpl.mockResolvedValue({
        content: "Anthropic response",
        tokensUsed: { prompt: 5, completion: 3, total: 8 },
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });

      const { complete } = await import("@lib/ai/providers");

      await complete(mockOptions, "openai");

      // OpenAI should only be called once (as preferred), not again in fallback
      expect(mockOpenAICompleteImpl).toHaveBeenCalledTimes(1);
      expect(mockAnthropicCompleteImpl).toHaveBeenCalledTimes(1);
    });

    it("throws when all providers fail", async () => {
      mockOpenAICompleteImpl.mockRejectedValue(new Error("OpenAI down"));
      mockAnthropicCompleteImpl.mockRejectedValue(new Error("Anthropic down"));

      const { complete } = await import("@lib/ai/providers");

      await expect(complete(mockOptions)).rejects.toThrow("Anthropic down");
    });

    it("throws when no providers configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = false;

      const { complete } = await import("@lib/ai/providers");

      await expect(complete(mockOptions)).rejects.toThrow(
        "No AI providers configured or all providers failed"
      );
    });

    it("throws correct error when preferred provider not configured and fallback fails", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicCompleteImpl.mockRejectedValue(new Error("Anthropic error"));

      const { complete } = await import("@lib/ai/providers");

      await expect(complete(mockOptions, "openai")).rejects.toThrow("Anthropic error");
    });

    it("handles non-Error thrown values", async () => {
      mockOpenAICompleteImpl.mockRejectedValue("String error");
      mockAnthropicCompleteImpl.mockRejectedValue("Another string error");

      const { complete } = await import("@lib/ai/providers");

      await expect(complete(mockOptions)).rejects.toThrow("Another string error");
    });
  });

  describe("stream", () => {
    const mockOptions = {
      messages: [{ role: "user" as const, content: "Hello" }],
    };

    it("streams from preferred provider when specified", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Hello" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 2, total: 7 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      expect(mockOpenAIStreamImpl).toHaveBeenCalled();
      expect(chunks).toContainEqual({ type: "content", content: "Hello" });
    });

    it("streams from anthropic when specified as preferred", async () => {
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Hi there" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "anthropic")) {
        chunks.push(chunk);
      }

      expect(mockAnthropicStreamImpl).toHaveBeenCalled();
      expect(chunks).toContainEqual({ type: "content", content: "Hi there" });
    });

    it("falls back when preferred stream yields error chunk", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "error", error: "OpenAI stream failed" };
      });
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Fallback response" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      expect(mockOpenAIStreamImpl).toHaveBeenCalled();
      expect(mockAnthropicStreamImpl).toHaveBeenCalled();
      expect(chunks).toContainEqual({ type: "content", content: "Fallback response" });
    });

    it("falls back when preferred stream throws", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        throw new Error("OpenAI connection failed");
      });
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Anthropic backup" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      expect(chunks).toContainEqual({ type: "content", content: "Anthropic backup" });
    });

    it("tries openai first when no preferred provider", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "OpenAI" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 2, total: 7 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions)) {
        chunks.push(chunk);
      }

      expect(mockOpenAIStreamImpl).toHaveBeenCalled();
      expect(mockAnthropicStreamImpl).not.toHaveBeenCalled();
    });

    it("skips unconfigured providers in stream", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Anthropic only" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions)) {
        chunks.push(chunk);
      }

      expect(mockOpenAIStreamImpl).not.toHaveBeenCalled();
      expect(chunks).toContainEqual({ type: "content", content: "Anthropic only" });
    });

    it("does not retry preferred provider in fallback loop", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "error", error: "OpenAI failed" };
      });
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Anthropic" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 2, total: 7 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      // OpenAI should only be called once (as preferred)
      expect(mockOpenAIStreamImpl).toHaveBeenCalledTimes(1);
      expect(mockAnthropicStreamImpl).toHaveBeenCalledTimes(1);
    });

    it("yields error chunk when all providers fail", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "error", error: "OpenAI failed" };
      });
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "error", error: "Anthropic failed" };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions)) {
        chunks.push(chunk);
      }

      expect(chunks[chunks.length - 1]).toEqual({
        type: "error",
        error: "Anthropic failed",
      });
    });

    it("yields error chunk when no providers configured", async () => {
      mockOpenAIConfigured = false;
      mockAnthropicConfigured = false;

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        {
          type: "error",
          error: "No AI providers configured or all providers failed",
        },
      ]);
    });

    it("yields all content chunks before done", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Hello" };
        yield { type: "content", content: " world" };
        yield { type: "content", content: "!" };
        yield { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { type: "content", content: "Hello" },
        { type: "content", content: " world" },
        { type: "content", content: "!" },
        { type: "done", tokensUsed: { prompt: 5, completion: 3, total: 8 } },
      ]);
    });

    it("handles mixed error and content chunks before failure", async () => {
      mockOpenAIStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Start..." };
        yield { type: "error", error: "Mid-stream failure" };
      });
      mockAnthropicStreamImpl.mockImplementation(async function* () {
        yield { type: "content", content: "Complete response" };
        yield { type: "done", tokensUsed: { prompt: 10, completion: 5, total: 15 } };
      });

      const { stream } = await import("@lib/ai/providers");

      const chunks = [];
      for await (const chunk of stream(mockOptions, "openai")) {
        chunks.push(chunk);
      }

      // Should only have anthropic chunks since openai failed mid-stream
      expect(chunks).toContainEqual({ type: "content", content: "Complete response" });
    });
  });

  describe("re-exports", () => {
    it("exports types from types module", async () => {
      const providers = await import("@lib/ai/providers");

      // Should export constants
      expect(providers.DEFAULT_MODELS).toBeDefined();
      expect(providers.TOKEN_LIMITS).toBeDefined();
    });
  });
});
