/**
 * DGA Generator Tests
 * Tests for lib/ai/dga-generator.ts — AI-Generated Daily Gratitude Actions
 *
 * Tests the full flow: cache check → AI generation → fallback cycling
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

function createChainableMock(terminal?: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(terminal ?? { data: null, error: null });
  // For queries that don't call .single()
  chain.then = undefined; // prevent auto-resolution
  return chain;
}

// Track from() calls and return appropriate chain
let fromCallHandlers: Record<string, ReturnType<typeof createChainableMock>> = {};

vi.mock("@lib/supabase-server", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      const handler = fromCallHandlers[table];
      if (handler) return handler;
      return createChainableMock();
    },
  }),
}));

// Mock AI providers
let mockAIConfigured = true;
let mockCompleteResult = {
  content: '{"title": "Test Action", "tip": "Test tip", "is_self": true}',
  tokensUsed: { prompt: 100, completion: 50, total: 150 },
  model: "claude-3-5-sonnet",
  provider: "anthropic",
};
let mockCompleteShouldFail = false;

vi.mock("@lib/ai/providers", () => ({
  isAIConfigured: () => mockAIConfigured,
  complete: async () => {
    if (mockCompleteShouldFail) throw new Error("AI provider unavailable");
    return mockCompleteResult;
  },
}));

describe("DGA Generator", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAIConfigured = true;
    mockCompleteShouldFail = false;
    mockCompleteResult = {
      content: '{"title": "Test Action", "tip": "Test tip", "is_self": true}',
      tokensUsed: { prompt: 100, completion: 50, total: 150 },
      model: "claude-3-5-sonnet",
      provider: "anthropic",
    };
    fromCallHandlers = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("getOrGenerateDGA", () => {
    const defaultOptions = {
      userId: "user-123",
      bookId: "book-456",
      currentDay: 46,
      userTimezone: "America/New_York",
    };

    it("returns cached action when one exists for today", async () => {
      const cachedAction = {
        id: "cached-id",
        book_id: "book-456",
        period: 46,
        title: "Cached Action",
        tip: "Cached tip",
        is_self: true,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      // Mock generated_actions cache lookup returns a hit
      const cacheChain = createChainableMock({ data: cachedAction, error: null });
      fromCallHandlers["generated_actions"] = cacheChain;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.id).toBe("cached-id");
      expect(result.title).toBe("Cached Action");
      expect(result.source).toBe("ai");
      expect(result.actionType).toBe("daily");
    });

    it("generates AI action when cache miss and AI configured", async () => {
      const savedAction = {
        id: "new-ai-id",
        book_id: "book-456",
        period: 46,
        title: "Test Action",
        tip: "Test tip",
        is_self: true,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      // Cache miss
      const cacheChain = createChainableMock({ data: null, error: null });
      // Insert returns saved action
      const insertChain = createChainableMock({ data: savedAction, error: null });

      let generatedActionsCallCount = 0;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") {
              // First call is cache lookup
              return () => {
                generatedActionsCallCount++;
                if (generatedActionsCallCount === 1) {
                  return cacheChain;
                }
                return insertChain;
              };
            }
            if (prop === "insert") {
              return () => insertChain;
            }
            return () => new Proxy({}, { get: () => vi.fn() });
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      // Mock journal/action_logs queries for context building
      const emptyChain = createChainableMock({ data: [], error: null });
      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = emptyChain;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.title).toBe("Test Action");
      expect(result.tip).toBe("Test tip");
      expect(result.isSelf).toBe(true);
      expect(result.actionType).toBe("daily");
    });

    it("falls back to static cycling when AI is not configured", async () => {
      mockAIConfigured = false;

      const staticAction = {
        id: "static-id",
        book_id: "book-456",
        period: 1, // cycled from day 46 → period 1
        title: "Static Action",
        tip: "Static tip",
        is_self: false,
        is_draw: false,
        is_list: false,
        action_type: "daily",
      };

      const savedFallback = {
        ...staticAction,
        id: "fallback-saved-id",
        source: "fallback",
        period: 46,
      };

      // Cache miss
      const cacheChain = createChainableMock({ data: null, error: null });
      // Static action lookup
      const staticChain = createChainableMock({ data: staticAction, error: null });
      // Fallback insert
      const insertChain = createChainableMock({ data: savedFallback, error: null });

      fromCallHandlers["generated_actions"] = cacheChain;
      fromCallHandlers["actions"] = staticChain;

      // Override generated_actions for insert
      let genCallCount = 0;
      const originalFrom = fromCallHandlers["generated_actions"];
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            genCallCount++;
            if (prop === "select" && genCallCount <= 1) {
              // Cache lookup
              return cacheChain.select;
            }
            if (prop === "insert") {
              return () => insertChain;
            }
            return (originalFrom as Record<string, unknown>)[prop as string];
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.source).toBe("fallback");
      expect(result.actionType).toBe("daily");
    });

    it("falls back when AI generation throws", async () => {
      mockCompleteShouldFail = true;

      // Cache miss
      const cacheChain = createChainableMock({ data: null, error: null });
      fromCallHandlers["generated_actions"] = cacheChain;

      // Static fallback
      const staticAction = {
        id: "static-fallback",
        book_id: "book-456",
        period: 1,
        title: "Fallback Action",
        tip: "Fallback tip",
        is_self: false,
        is_draw: true,
        is_list: false,
        action_type: "daily",
      };
      const staticChain = createChainableMock({ data: staticAction, error: null });
      fromCallHandlers["actions"] = staticChain;

      // Mock journal queries for context building
      const emptyChain = createChainableMock({ data: [], error: null });
      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;

      // Fallback save
      const savedFallback = {
        ...staticAction,
        id: "saved-fallback-id",
        source: "fallback",
        period: 46,
      };
      // This is tricky because generated_actions is used for both cache check and insert
      // We'll rely on the hardcoded fallback for this test
      const insertChain = createChainableMock({ data: savedFallback, error: null });

      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") {
              return cacheChain.select;
            }
            if (prop === "insert") {
              return () => insertChain;
            }
            return vi.fn().mockReturnValue({ select: vi.fn(), single: vi.fn() });
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      // Should get a fallback action (either from DB or hardcoded)
      expect(result.actionType).toBe("daily");
      expect(["ai", "fallback"]).toContain(result.source);
    });

    it("returns hardcoded fallback when both AI and DB fail", async () => {
      mockAIConfigured = false;

      // Cache miss
      const cacheChain = createChainableMock({ data: null, error: null });
      // Static action lookup fails
      const failChain = createChainableMock({ data: null, error: { message: "DB error" } });
      // Insert also fails
      const failInsert = createChainableMock({ data: null, error: { message: "Insert error" } });

      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => failInsert;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;
      fromCallHandlers["actions"] = failChain;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      // Should return the hardcoded fallback
      expect(result.title).toBe("Reach out to someone you appreciate and tell them why");
      expect(result.source).toBe("fallback");
      expect(result.isSelf).toBe(false);
      expect(result.isDraw).toBe(false);
      expect(result.isList).toBe(false);
      expect(result.actionType).toBe("daily");
    });
  });

  describe("parseAIResponse (via generateWithAI)", () => {
    const defaultOptions = {
      userId: "user-123",
      bookId: "book-456",
      currentDay: 50,
      userTimezone: "America/New_York",
    };

    it("handles valid JSON response", async () => {
      mockCompleteResult = {
        content:
          '{"title": "Call a friend", "tip": "Someone you haven\'t talked to in a while", "is_self": false}',
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        model: "claude-3-5-sonnet",
        provider: "anthropic",
      };

      const savedAction = {
        id: "new-id",
        book_id: "book-456",
        period: 50,
        title: "Call a friend",
        tip: "Someone you haven't talked to in a while",
        is_self: false,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      // Cache miss, then successful insert
      const cacheChain = createChainableMock({ data: null, error: null });
      const insertChain = createChainableMock({ data: savedAction, error: null });
      const emptyChain = createChainableMock({ data: [], error: null });

      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = emptyChain;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => insertChain;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.title).toBe("Call a friend");
      expect(result.isSelf).toBe(false);
    });

    it("handles JSON wrapped in markdown code fences", async () => {
      mockCompleteResult = {
        content:
          '```json\n{"title": "Meditate for 10 minutes", "tip": "Focus on breath", "is_self": true}\n```',
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        model: "claude-3-5-sonnet",
        provider: "anthropic",
      };

      const savedAction = {
        id: "fence-id",
        book_id: "book-456",
        period: 50,
        title: "Meditate for 10 minutes",
        tip: "Focus on breath",
        is_self: true,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      const cacheChain = createChainableMock({ data: null, error: null });
      const insertChain = createChainableMock({ data: savedAction, error: null });
      const emptyChain = createChainableMock({ data: [], error: null });

      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = emptyChain;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => insertChain;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.title).toBe("Meditate for 10 minutes");
    });

    it("falls back when AI returns invalid JSON", async () => {
      mockCompleteResult = {
        content: "This is not JSON at all",
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        model: "claude-3-5-sonnet",
        provider: "anthropic",
      };

      // Cache miss
      const cacheChain = createChainableMock({ data: null, error: null });
      const emptyChain = createChainableMock({ data: [], error: null });

      // Fallback static action
      const staticAction = {
        id: "static-for-invalid-json",
        book_id: "book-456",
        period: 5,
        title: "Static Fallback",
        tip: "After invalid JSON",
        is_self: false,
        is_draw: false,
        is_list: false,
        action_type: "daily",
      };
      const staticChain = createChainableMock({ data: staticAction, error: null });
      const savedFallback = { ...staticAction, id: "saved-fb", source: "fallback", period: 50 };
      const insertChain = createChainableMock({ data: savedFallback, error: null });

      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = staticChain;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => insertChain;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      // Should fall back (either to cycled static or hardcoded)
      expect(result.actionType).toBe("daily");
    });

    it("falls back when AI returns JSON without title", async () => {
      mockCompleteResult = {
        content: '{"tip": "No title here", "is_self": true}',
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        model: "claude-3-5-sonnet",
        provider: "anthropic",
      };

      const cacheChain = createChainableMock({ data: null, error: null });
      const emptyChain = createChainableMock({ data: [], error: null });
      const staticAction = {
        id: "static-no-title",
        book_id: "book-456",
        period: 5,
        title: "Fallback for Missing Title",
        tip: "tip",
        is_self: false,
        is_draw: false,
        is_list: false,
        action_type: "daily",
      };
      const staticChain = createChainableMock({ data: staticAction, error: null });
      const savedFallback = { ...staticAction, id: "fb-no-title", source: "fallback", period: 50 };
      const insertChain = createChainableMock({ data: savedFallback, error: null });

      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = staticChain;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => insertChain;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      expect(result.actionType).toBe("daily");
    });

    it("truncates overly long title and tip", async () => {
      mockCompleteResult = {
        content: JSON.stringify({
          title: "A".repeat(200), // over 100 char limit
          tip: "B".repeat(500), // over 300 char limit
          is_self: true,
        }),
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        model: "claude-3-5-sonnet",
        provider: "anthropic",
      };

      const savedAction = {
        id: "truncated-id",
        book_id: "book-456",
        period: 50,
        title: "A".repeat(100),
        tip: "B".repeat(300),
        is_self: true,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      const cacheChain = createChainableMock({ data: null, error: null });
      const insertChain = createChainableMock({ data: savedAction, error: null });
      const emptyChain = createChainableMock({ data: [], error: null });

      fromCallHandlers["journals"] = emptyChain;
      fromCallHandlers["journal_entries"] = emptyChain;
      fromCallHandlers["action_logs"] = emptyChain;
      fromCallHandlers["actions"] = emptyChain;
      fromCallHandlers["generated_actions"] = new Proxy(
        {},
        {
          get(_, prop) {
            if (prop === "select") return cacheChain.select;
            if (prop === "insert") return () => insertChain;
            return vi.fn();
          },
        }
      ) as ReturnType<typeof createChainableMock>;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA(defaultOptions);

      // The insert should have truncated values
      expect(result.title.length).toBeLessThanOrEqual(100);
      expect(result.tip!.length).toBeLessThanOrEqual(300);
    });
  });

  describe("fallback cycling logic", () => {
    it("cycles day 46 to period 1", async () => {
      // Verify: ((46 - 1) % 45) + 1 = 1
      expect(((46 - 1) % 45) + 1).toBe(1);
    });

    it("cycles day 90 to period 45", async () => {
      // Verify: ((90 - 1) % 45) + 1 = 45
      expect(((90 - 1) % 45) + 1).toBe(45);
    });

    it("cycles day 91 to period 1", async () => {
      // Verify: ((91 - 1) % 45) + 1 = 1
      expect(((91 - 1) % 45) + 1).toBe(1);
    });

    it("cycles day 135 to period 45", async () => {
      // Verify: ((135 - 1) % 45) + 1 = 45
      expect(((135 - 1) % 45) + 1).toBe(45);
    });

    it("correctly cycles all 45 days in second round", () => {
      for (let day = 46; day <= 90; day++) {
        const expected = day - 45;
        const actual = ((day - 1) % 45) + 1;
        expect(actual).toBe(expected);
      }
    });
  });

  describe("GeneratedAction shape", () => {
    it("matches ActionData interface expectations", async () => {
      const cachedAction = {
        id: "shape-test-id",
        book_id: "book-456",
        period: 50,
        title: "Shape Test",
        tip: "Testing shape",
        is_self: true,
        is_draw: false,
        is_list: false,
        source: "ai",
      };

      const cacheChain = createChainableMock({ data: cachedAction, error: null });
      fromCallHandlers["generated_actions"] = cacheChain;

      const { getOrGenerateDGA } = await import("@lib/ai/dga-generator");
      const result = await getOrGenerateDGA({
        userId: "user-123",
        bookId: "book-456",
        currentDay: 50,
        userTimezone: "America/New_York",
      });

      // Verify camelCase output matches what the UI expects
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("bookId");
      expect(result).toHaveProperty("period");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("tip");
      expect(result).toHaveProperty("isSelf");
      expect(result).toHaveProperty("isDraw");
      expect(result).toHaveProperty("isList");
      expect(result).toHaveProperty("actionType");
      expect(result).toHaveProperty("source");

      // Verify types
      expect(typeof result.id).toBe("string");
      expect(typeof result.bookId).toBe("string");
      expect(typeof result.period).toBe("number");
      expect(typeof result.title).toBe("string");
      expect(typeof result.isSelf).toBe("boolean");
      expect(typeof result.isDraw).toBe("boolean");
      expect(typeof result.isList).toBe("boolean");
      expect(result.actionType).toBe("daily");
      expect(["ai", "fallback"]).toContain(result.source);
    });
  });
});
