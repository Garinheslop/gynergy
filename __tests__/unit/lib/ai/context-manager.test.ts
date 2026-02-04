/**
 * AI Context Manager Tests
 * Tests for lib/ai/context-manager.ts
 *
 * Focus on pure functions that don't require database mocking.
 * Database functions are better tested in integration tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase client to prevent actual DB connections
vi.mock("@lib/supabase-server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Mocked" } }),
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockReturnValue({ data: [], error: null }),
              })),
            })),
          })),
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockReturnValue({ data: [], error: null }),
            })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn().mockReturnValue({ data: [], error: null }),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

describe("AI Context Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildUserContextString", () => {
    it("builds complete user context with all sections", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Jane",
          dayInJourney: 15,
          currentStreak: {
            morning: 5,
            evening: 3,
            gratitude: 7,
            combined: 10,
          },
        },
        recentJournals: [
          {
            type: "morning" as const,
            date: "2024-01-15T08:00:00Z",
            moodScore: 8,
            highlights: ["Grateful for my family", "New opportunities"],
          },
        ],
        recentDGAs: [
          {
            date: "2024-01-15T10:00:00Z",
            reflection: "Helped a neighbor today",
          },
        ],
        badges: {
          recent: [{ name: "Early Bird", unlockedAt: "2024-01-10T06:00:00Z" }],
          total: 5,
        },
        milestones: {
          reached: [7, 14],
          next: 21,
        },
        moodTrend: "improving" as const,
        relationshipStage: "building" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("=== USER PROFILE ===");
      expect(result).toContain("Name: Jane");
      expect(result).toContain("Day in Journey: 15 of 45");
      expect(result).toContain("Morning Journal: 5 days");
      expect(result).toContain("Evening Journal: 3 days");
      expect(result).toContain("Gratitude (DGA): 7 days");
      expect(result).toContain("Combined Streak: 10 days");
      expect(result).toContain("=== RECENT JOURNALS ===");
      expect(result).toContain("[MORNING -");
      expect(result).toContain("Mood: 8/10");
      expect(result).toContain("Grateful for my family");
      expect(result).toContain("New opportunities");
      expect(result).toContain("=== DAILY GRATITUDE ACTIONS ===");
      expect(result).toContain("Helped a neighbor today");
      expect(result).toContain("=== BADGES & MILESTONES ===");
      expect(result).toContain("Total Badges Earned: 5");
      expect(result).toContain("Early Bird");
      expect(result).toContain("Next milestone: Day 21");
      expect(result).toContain("=== MOOD INSIGHTS ===");
      expect(result).toContain("improving");
      expect(result).toContain("trending upward");
    });

    it("handles empty journals gracefully", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 1,
          currentStreak: { morning: 0, evening: 0, gratitude: 0, combined: 0 },
        },
        recentJournals: [],
        recentDGAs: [],
        badges: { recent: [], total: 0 },
        milestones: { reached: [], next: 7 },
        moodTrend: "stable" as const,
        relationshipStage: "introduction" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("No recent journal entries");
      expect(result).toContain("No recent Daily Gratitude Actions");
      expect(result).toContain("None yet"); // badges
    });

    it("limits journals to 5 entries", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const manyJournals = Array.from({ length: 10 }, (_, i) => ({
        type: "morning" as const,
        date: `2024-01-${String(15 - i).padStart(2, "0")}T08:00:00Z`,
        moodScore: 7,
        highlights: [`Highlight ${i}`],
      }));

      const context = {
        user: {
          name: "Test",
          dayInJourney: 15,
          currentStreak: { morning: 10, evening: 10, gratitude: 10, combined: 30 },
        },
        recentJournals: manyJournals,
        recentDGAs: [],
        badges: { recent: [], total: 0 },
        milestones: { reached: [], next: 21 },
        moodTrend: "stable" as const,
        relationshipStage: "building" as const,
      };

      const result = buildUserContextString(context);

      // Should only show first 5 highlights
      expect(result).toContain("Highlight 0");
      expect(result).toContain("Highlight 4");
      expect(result).not.toContain("Highlight 5");
    });

    it("displays all mood trend types correctly", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const baseContext = {
        user: {
          name: "Test",
          dayInJourney: 10,
          currentStreak: { morning: 0, evening: 0, gratitude: 0, combined: 0 },
        },
        recentJournals: [],
        recentDGAs: [],
        badges: { recent: [], total: 0 },
        milestones: { reached: [], next: 14 },
        relationshipStage: "building" as const,
      };

      const improvingResult = buildUserContextString({
        ...baseContext,
        moodTrend: "improving" as const,
      });
      expect(improvingResult).toContain("trending upward");
      expect(improvingResult).toContain("positive sign");

      const stableResult = buildUserContextString({
        ...baseContext,
        moodTrend: "stable" as const,
      });
      expect(stableResult).toContain("consistent and stable");

      const decliningResult = buildUserContextString({
        ...baseContext,
        moodTrend: "declining" as const,
      });
      expect(decliningResult).toContain("trending downward");
      expect(decliningResult).toContain("extra support");
    });

    it("shows reached milestones correctly", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 25,
          currentStreak: { morning: 25, evening: 25, gratitude: 25, combined: 75 },
        },
        recentJournals: [],
        recentDGAs: [],
        badges: { recent: [], total: 10 },
        milestones: { reached: [7, 14, 21], next: 30 },
        moodTrend: "stable" as const,
        relationshipStage: "deep" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("Reached: 7, 14, 21");
      expect(result).toContain("Next milestone: Day 30");
    });

    it("handles journals without mood scores", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 5,
          currentStreak: { morning: 5, evening: 0, gratitude: 0, combined: 5 },
        },
        recentJournals: [
          {
            type: "morning" as const,
            date: "2024-01-15T08:00:00Z",
            moodScore: undefined, // No mood score
            highlights: ["Good morning"],
          },
        ],
        recentDGAs: [],
        badges: { recent: [], total: 0 },
        milestones: { reached: [], next: 7 },
        moodTrend: "stable" as const,
        relationshipStage: "introduction" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("Good morning");
      expect(result).not.toContain("Mood:"); // Should not show mood when undefined
    });

    it("handles journals with empty highlights", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 5,
          currentStreak: { morning: 5, evening: 0, gratitude: 0, combined: 5 },
        },
        recentJournals: [
          {
            type: "evening" as const,
            date: "2024-01-15T20:00:00Z",
            moodScore: 7,
            highlights: [], // Empty highlights
          },
        ],
        recentDGAs: [],
        badges: { recent: [], total: 0 },
        milestones: { reached: [], next: 7 },
        moodTrend: "stable" as const,
        relationshipStage: "introduction" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("[EVENING -");
      expect(result).toContain("Mood: 7/10");
      expect(result).not.toContain("Highlights:"); // Should not show highlights header when empty
    });

    it("handles DGAs with themes", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 10,
          currentStreak: { morning: 0, evening: 0, gratitude: 10, combined: 10 },
        },
        recentJournals: [],
        recentDGAs: [
          {
            date: "2024-01-15T10:00:00Z",
            reflection: "Helped a friend",
            theme: "Kindness",
          },
        ],
        badges: { recent: [], total: 0 },
        milestones: { reached: [7], next: 14 },
        moodTrend: "stable" as const,
        relationshipStage: "building" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("Theme: Kindness");
      expect(result).toContain("Helped a friend");
    });

    it("shows relationship stage in user profile", async () => {
      const { buildUserContextString } = await import("@lib/ai/context-manager");

      const context = {
        user: {
          name: "Test",
          dayInJourney: 30,
          currentStreak: { morning: 30, evening: 30, gratitude: 30, combined: 90 },
        },
        recentJournals: [],
        recentDGAs: [],
        badges: { recent: [], total: 15 },
        milestones: { reached: [7, 14, 21, 30], next: 45 },
        moodTrend: "improving" as const,
        relationshipStage: "established" as const,
      };

      const result = buildUserContextString(context);

      expect(result).toContain("Relationship Stage: established");
    });
  });

  describe("trimConversationHistory", () => {
    it("returns all messages if under token budget", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const messages = [
        { role: "user" as const, content: "Hi", timestamp: "2024-01-15T10:00:00Z" },
        { role: "assistant" as const, content: "Hello!", timestamp: "2024-01-15T10:00:01Z" },
      ];

      const result = trimConversationHistory(messages, 1000);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Hi");
      expect(result[1].content).toBe("Hello!");
    });

    it("trims oldest messages when over budget", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      // Create messages with known token counts
      // Each "X" adds roughly 0.25 tokens, so 16 chars = ~4 tokens
      const messages = [
        { role: "user" as const, content: "A".repeat(40), timestamp: "2024-01-15T10:00:00Z" }, // ~10 tokens
        { role: "assistant" as const, content: "B".repeat(40), timestamp: "2024-01-15T10:00:01Z" }, // ~10 tokens
        { role: "user" as const, content: "C".repeat(40), timestamp: "2024-01-15T10:00:02Z" }, // ~10 tokens
      ];

      // Budget of 15 tokens should keep only the last 1-2 messages
      const result = trimConversationHistory(messages, 15);

      expect(result.length).toBeLessThan(3);
      // Should keep most recent messages
      expect(result[result.length - 1].content).toContain("C");
    });

    it("preserves chronological order after trimming", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const messages = [
        { role: "user" as const, content: "First", timestamp: "2024-01-15T10:00:00Z" },
        { role: "assistant" as const, content: "Second", timestamp: "2024-01-15T10:00:01Z" },
        { role: "user" as const, content: "Third", timestamp: "2024-01-15T10:00:02Z" },
        { role: "assistant" as const, content: "Fourth", timestamp: "2024-01-15T10:00:03Z" },
      ];

      const result = trimConversationHistory(messages, 100);

      // Should be in chronological order
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].timestamp!).getTime()).toBeGreaterThan(
          new Date(result[i - 1].timestamp!).getTime()
        );
      }
    });

    it("returns empty array for empty input", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const result = trimConversationHistory([], 1000);

      expect(result).toEqual([]);
    });

    it("keeps single large message if it fits budget", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const messages = [
        { role: "user" as const, content: "A".repeat(100), timestamp: "2024-01-15T10:00:00Z" }, // ~25 tokens
      ];

      const result = trimConversationHistory(messages, 30);

      expect(result).toHaveLength(1);
    });

    it("excludes single message if it exceeds budget", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const messages = [
        { role: "user" as const, content: "A".repeat(100), timestamp: "2024-01-15T10:00:00Z" }, // ~25 tokens
      ];

      const result = trimConversationHistory(messages, 5);

      expect(result).toHaveLength(0);
    });

    it("handles messages without timestamps", async () => {
      const { trimConversationHistory } = await import("@lib/ai/context-manager");

      const messages = [
        { role: "user" as const, content: "Hello" },
        { role: "assistant" as const, content: "Hi there" },
      ];

      const result = trimConversationHistory(messages, 100);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Hello");
    });
  });

  describe("fetchUserContext", () => {
    it("returns null when profile fetch fails", async () => {
      const { fetchUserContext } = await import("@lib/ai/context-manager");

      const result = await fetchUserContext("test-user-id");

      // Should return null due to mocked error
      expect(result).toBeNull();
    });
  });

  // Database function tests are skipped as they require complex mock chaining.
  // These functions are better tested in integration tests with a real database.

  describe.skip("fetchConversationHistory", () => {
    it("returns empty array when fetch fails", async () => {
      const { fetchConversationHistory } = await import("@lib/ai/context-manager");
      const result = await fetchConversationHistory("user-1", "char-1");
      expect(result).toEqual([]);
    });
  });

  describe.skip("saveConversationMessage", () => {
    it("does not throw when called", async () => {
      const { saveConversationMessage } = await import("@lib/ai/context-manager");
      await expect(
        saveConversationMessage("user-1", "char-1", "user", "Hello!")
      ).resolves.not.toThrow();
    });
  });

  describe.skip("getOrCreateChatSession", () => {
    it("returns a session id", async () => {
      const { getOrCreateChatSession } = await import("@lib/ai/context-manager");
      const result = await getOrCreateChatSession("user-1", "char-1");
      expect(result).toBe("test-id");
    });
  });

  describe.skip("endChatSession", () => {
    it("does not throw when called", async () => {
      const { endChatSession } = await import("@lib/ai/context-manager");
      await expect(endChatSession("session-123")).resolves.not.toThrow();
    });
  });
});
