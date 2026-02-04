/**
 * Badge Service Tests
 * Tests for badge checking, awarding, and management functions
 */
import { describe, it, expect, vi } from "vitest";

import {
  checkBadgeCondition,
  checkAndAwardBadges,
  getUserBadges,
  getAllBadges,
  getNewBadges,
  markBadgeSeen,
  toggleBadgeShowcase,
} from "@lib/services/badgeService";
import {
  Badge,
  BadgeCheckContext,
  StreakCondition,
  FirstCondition,
  ComboCondition,
  TimeCondition,
  MilestoneCondition,
  ComebackCondition,
  WeekendCondition,
  MoodCondition,
  CompleteCondition,
  ShareCondition,
  EncourageCondition,
} from "@resources/types/gamification";

// Helper to create a mock badge
function createMockBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: "badge-1",
    name: "Test Badge",
    description: "A test badge",
    icon: "test-icon",
    category: "achievement",
    rarity: "common",
    unlockCondition: { type: "streak", activity: "all", count: 7 },
    pointsReward: 50,
    isHidden: false,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create a mock context
function createMockContext(overrides: Partial<BadgeCheckContext> = {}): BadgeCheckContext {
  return {
    userId: "user-1",
    sessionId: "session-1",
    timestamp: new Date("2024-01-15T10:00:00"),
    streaks: {
      morning: 0,
      evening: 0,
      gratitude: 0,
      combined: 0,
      weekly: 0,
    },
    totalCounts: {
      morningJournals: 0,
      eveningJournals: 0,
      dgas: 0,
      weeklyJournals: 0,
      shares: 0,
      encouragements: 0,
    },
    completedToday: {
      morning: false,
      evening: false,
      dga: false,
    },
    dayInJourney: 1,
    milestone: null,
    lastJournalDate: null,
    moodHistory: [],
    ...overrides,
  };
}

describe("Badge Service - Condition Checkers", () => {
  describe("checkStreakCondition", () => {
    it("should return true when morning streak meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "morning", count: 7 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 7, evening: 0, gratitude: 0, combined: 0, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when morning streak is below threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "morning", count: 7 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 5, evening: 0, gratitude: 0, combined: 0, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return true when evening streak meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "evening", count: 14 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 0, evening: 14, gratitude: 0, combined: 0, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return true when combined streak meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "all", count: 30 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 30, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return true when weekly streak meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "weekly", count: 4 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 0, weekly: 4 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return true when gratitude streak meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "streak", activity: "gratitude", count: 10 } as StreakCondition,
      });
      const context = createMockContext({
        streaks: { morning: 0, evening: 0, gratitude: 10, combined: 0, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });
  });

  describe("checkFirstCondition", () => {
    it("should return true for first morning journal", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "first", activity: "morning" } as FirstCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 1,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false if not the first morning journal", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "first", activity: "morning" } as FirstCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 2,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return true for first evening journal", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "first", activity: "evening" } as FirstCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 0,
          eveningJournals: 1,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return true for first DGA", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "first", activity: "dga" } as FirstCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 0,
          eveningJournals: 0,
          dgas: 1,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });
  });

  describe("checkComboCondition", () => {
    it("should return true when all activities completed today", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "combo",
          activities: ["morning", "evening", "dga"],
          count: 1,
        } as ComboCondition,
      });
      const context = createMockContext({
        completedToday: { morning: true, evening: true, dga: true },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when not all activities completed", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "combo",
          activities: ["morning", "evening", "dga"],
          count: 1,
        } as ComboCondition,
      });
      const context = createMockContext({
        completedToday: { morning: true, evening: true, dga: false },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should check combined streak for count > 1", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "combo",
          activities: ["morning", "evening"],
          count: 7,
        } as ComboCondition,
      });
      const context = createMockContext({
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 7, weekly: 0 },
        completedToday: { morning: true, evening: true, dga: false },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });
  });

  describe("checkTimeCondition", () => {
    it("should return true when time is before the threshold", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "time",
          activity: "morning",
          before: "08:00",
        } as TimeCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T07:30:00"),
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when time is at or after the threshold", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "time",
          activity: "morning",
          before: "08:00",
        } as TimeCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T08:00:00"),
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return true when time is after the threshold", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "time",
          activity: "evening",
          after: "20:00",
        } as TimeCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T21:00:00"),
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when time is before the after threshold", () => {
      const badge = createMockBadge({
        unlockCondition: {
          type: "time",
          activity: "evening",
          after: "20:00",
        } as TimeCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T19:30:00"),
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkShareCondition", () => {
    it("should return true when share count meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "share", count: 5 } as ShareCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 0,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 5,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when share count is below threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "share", count: 5 } as ShareCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 0,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 3,
          encouragements: 0,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkEncourageCondition", () => {
    it("should return true when encouragement count meets threshold", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "encourage", count: 10 } as EncourageCondition,
      });
      const context = createMockContext({
        totalCounts: {
          morningJournals: 0,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 10,
        },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });
  });

  describe("checkMilestoneCondition", () => {
    it("should return true when at milestone", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "milestone", number: 15 } as MilestoneCondition,
      });
      const context = createMockContext({
        milestone: 15,
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when not at milestone", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "milestone", number: 15 } as MilestoneCondition,
      });
      const context = createMockContext({
        milestone: 14,
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkComebackCondition", () => {
    it("should return true when returning after specified days away", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "comeback", days_away: 3 } as ComebackCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T10:00:00"),
        lastJournalDate: "2024-01-10T10:00:00",
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when not away long enough", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "comeback", days_away: 3 } as ComebackCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-15T10:00:00"),
        lastJournalDate: "2024-01-14T10:00:00",
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return false when no last journal date", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "comeback", days_away: 3 } as ComebackCondition,
      });
      const context = createMockContext({
        lastJournalDate: null,
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkWeekendCondition", () => {
    it("should return true on Sunday with all activities completed and streak >= 2", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "weekend" } as WeekendCondition,
      });
      // January 14, 2024 is a Sunday
      const context = createMockContext({
        timestamp: new Date("2024-01-14T10:00:00"),
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 2, weekly: 0 },
        completedToday: { morning: true, evening: true, dga: true },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false on non-Sunday", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "weekend" } as WeekendCondition,
      });
      // January 15, 2024 is a Monday
      const context = createMockContext({
        timestamp: new Date("2024-01-15T10:00:00"),
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 2, weekly: 0 },
        completedToday: { morning: true, evening: true, dga: true },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return false on Sunday without all activities completed", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "weekend" } as WeekendCondition,
      });
      const context = createMockContext({
        timestamp: new Date("2024-01-14T10:00:00"), // Sunday
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 2, weekly: 0 },
        completedToday: { morning: true, evening: false, dga: true },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkMoodCondition", () => {
    it("should return true when mood improved enough times", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "mood", count: 3 } as MoodCondition,
      });
      const context = createMockContext({
        moodHistory: [
          { date: "2024-01-10", score: 3 },
          { date: "2024-01-11", score: 4 }, // improvement
          { date: "2024-01-12", score: 5 }, // improvement
          { date: "2024-01-13", score: 4 }, // no improvement
          { date: "2024-01-14", score: 5 }, // improvement
        ],
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when not enough mood improvements", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "mood", count: 3 } as MoodCondition,
      });
      const context = createMockContext({
        moodHistory: [
          { date: "2024-01-10", score: 3 },
          { date: "2024-01-11", score: 4 }, // improvement
          { date: "2024-01-12", score: 3 }, // no improvement
        ],
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return false when mood history is too short", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "mood", count: 3 } as MoodCondition,
      });
      const context = createMockContext({
        moodHistory: [{ date: "2024-01-10", score: 3 }],
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("checkCompleteCondition", () => {
    it("should return true when graduated (45 days with 45 streak)", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "graduate" } as CompleteCondition,
      });
      const context = createMockContext({
        dayInJourney: 45,
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 45, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(true);
    });

    it("should return false when not at 45 days", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "graduate" } as CompleteCondition,
      });
      const context = createMockContext({
        dayInJourney: 40,
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 45, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });

    it("should return false when streak is not 45", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "graduate" } as CompleteCondition,
      });
      const context = createMockContext({
        dayInJourney: 45,
        streaks: { morning: 0, evening: 0, gratitude: 0, combined: 40, weekly: 0 },
      });

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });

  describe("Unknown condition type", () => {
    it("should return false for unknown condition types", () => {
      const badge = createMockBadge({
        unlockCondition: { type: "unknown" as any },
      });
      const context = createMockContext();

      expect(checkBadgeCondition(badge, context)).toBe(false);
    });
  });
});

describe("Badge Service - Database Operations", () => {
  // Create a mock Supabase client with proper chaining support
  function _createMockSupabase() {
    const mockData: Record<string, unknown[]> = {
      badges: [],
      user_badges: [],
    };
    let mockError: { message: string } | null = null;

    const createChainableQuery = (
      resolvedData: unknown = null,
      resolvedError: { message: string } | null = null
    ) => {
      const query: Record<string, unknown> = {};

      const chainMethods = [
        "select",
        "insert",
        "update",
        "delete",
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "order",
        "limit",
      ];
      chainMethods.forEach((method) => {
        query[method] = vi.fn().mockReturnValue(query);
      });

      query.single = vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError });

      // Make the query thenable (Promise-like) for when awaited directly
      query.then = (resolve: (value: unknown) => void) => {
        resolve({
          data: Array.isArray(resolvedData) ? resolvedData : resolvedData ? [resolvedData] : [],
          error: resolvedError,
        });
        return query;
      };

      return query;
    };

    return {
      from: vi.fn(() => createChainableQuery(mockData.badges, mockError)),
      __setData: (table: string, data: unknown[]) => {
        mockData[table] = data;
      },
      __setError: (error: { message: string } | null) => {
        mockError = error;
      },
      __getData: (table: string) => mockData[table],
      __createQuery: createChainableQuery,
    };
  }

  describe("getAllBadges", () => {
    it("should return all badges from database", async () => {
      const mockBadges = [
        { id: "1", name: "Badge 1", sort_order: 1 },
        { id: "2", name: "Badge 2", sort_order: 2 },
      ];

      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await getAllBadges(mockSupabase);

      expect(result.badges).toHaveLength(2);
      expect(result.error).toBeUndefined();
    });

    it("should return error when database fails", async () => {
      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await getAllBadges(mockSupabase);

      expect(result.badges).toEqual([]);
      expect(result.error).toBe("Database error");
    });
  });

  describe("getUserBadges", () => {
    it("should return user badges with badge details", async () => {
      const mockUserBadges = [
        { id: "ub1", user_id: "user-1", badge_id: "b1", badge: { id: "b1", name: "Badge 1" } },
      ];

      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUserBadges, error: null }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await getUserBadges(mockSupabase, "user-1", "session-1");

      expect(result.badges).toHaveLength(1);
      expect(result.error).toBeUndefined();
    });
  });

  describe("getNewBadges", () => {
    it("should return only new (unseen) badges", async () => {
      const mockNewBadges = [
        {
          id: "ub1",
          user_id: "user-1",
          badge_id: "b1",
          is_new: true,
          badge: { id: "b1", name: "New Badge" },
        },
      ];

      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockNewBadges, error: null }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await getNewBadges(mockSupabase, "user-1", "session-1");

      expect(result.badges).toHaveLength(1);
    });
  });

  describe("markBadgeSeen", () => {
    it("should mark badge as seen successfully", async () => {
      const query = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await markBadgeSeen(mockSupabase, "user-1", "badge-1");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error when update fails", async () => {
      const query = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const result = await markBadgeSeen(mockSupabase, "user-1", "badge-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("toggleBadgeShowcase", () => {
    it("should toggle showcase status successfully when under limit", async () => {
      // Create a mock that supports the full chain for toggleBadgeShowcase
      let callCount = 0;

      const createQuery = () => {
        callCount++;

        // First call: get current showcase status
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { is_showcased: true }, error: null }),
                }),
              }),
            }),
          };
        }

        // Third call: update
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      };

      const mockSupabase = { from: vi.fn(() => createQuery()) };

      const result = await toggleBadgeShowcase(mockSupabase, "user-1", "badge-1", "session-1");

      // Should succeed when toggling off (is_showcased: true -> false)
      expect(result.success).toBe(true);
    });

    it("should prevent showcasing more than 3 badges", async () => {
      let callCount = 0;

      const createQuery = () => {
        callCount++;

        // First call: get current showcase status (not showcased)
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { is_showcased: false }, error: null }),
                }),
              }),
            }),
          };
        }

        // Second call: count showcased badges (already 3)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [{}, {}, {}], error: null }), // 3 badges
            }),
          }),
        };
      };

      const mockSupabase = { from: vi.fn(() => createQuery()) };

      const result = await toggleBadgeShowcase(mockSupabase, "user-1", "badge-1", "session-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum 3 badges can be showcased");
    });
  });

  describe("checkAndAwardBadges", () => {
    it("should check and award eligible badges", async () => {
      // Mock badges data
      const mockBadges = [
        {
          id: "badge-1",
          name: "First Morning",
          unlock_condition: { type: "first", activity: "morning" },
          points_reward: 50,
          rarity: "common",
          is_hidden: false,
          sort_order: 1,
        },
      ];

      let fromCallCount = 0;

      const createQuery = () => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // Get all badges
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
          };
        }
        if (fromCallCount === 2) {
          // Get earned badges (empty)
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        // Insert new badge
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "user-badge-1",
              user_id: "user-1",
              badge_id: "badge-1",
              is_new: true,
            },
            error: null,
          }),
        };
      };

      const mockSupabase = { from: vi.fn(() => createQuery()) };

      const context = createMockContext({
        totalCounts: {
          morningJournals: 1,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      const result = await checkAndAwardBadges(mockSupabase, context);

      expect(result.newBadges).toHaveLength(1);
      expect(result.pointsAwarded).toBe(50);
      expect(result.celebrationEvents).toHaveLength(1);
    });

    it("should not award already earned badges", async () => {
      const mockBadges = [
        {
          id: "badge-1",
          name: "First Morning",
          unlock_condition: { type: "first", activity: "morning" },
          points_reward: 50,
          rarity: "common",
          is_hidden: false,
        },
      ];

      // Badge already earned
      const mockEarnedBadges = [{ badge_id: "badge-1" }];

      let fromCallCount = 0;

      const createQuery = () => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockEarnedBadges, error: null }),
          }),
        };
      };

      const mockSupabase = { from: vi.fn(() => createQuery()) };

      const context = createMockContext({
        totalCounts: {
          morningJournals: 1,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      const result = await checkAndAwardBadges(mockSupabase, context);

      expect(result.newBadges).toHaveLength(0);
      expect(result.pointsAwarded).toBe(0);
    });

    it("should skip hidden badges", async () => {
      const mockBadges = [
        {
          id: "badge-1",
          name: "Hidden Badge",
          unlock_condition: { type: "first", activity: "morning" },
          points_reward: 100,
          rarity: "legendary",
          is_hidden: true, // Hidden
        },
      ];

      let fromCallCount = 0;

      const createQuery = () => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      };

      const mockSupabase = { from: vi.fn(() => createQuery()) };

      const context = createMockContext({
        totalCounts: {
          morningJournals: 1,
          eveningJournals: 0,
          dgas: 0,
          weeklyJournals: 0,
          shares: 0,
          encouragements: 0,
        },
      });

      const result = await checkAndAwardBadges(mockSupabase, context);

      expect(result.newBadges).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      };

      const mockSupabase = { from: vi.fn(() => query) };

      const context = createMockContext();
      const result = await checkAndAwardBadges(mockSupabase, context);

      expect(result.newBadges).toEqual([]);
      expect(result.pointsAwarded).toBe(0);
      expect(result.celebrationEvents).toEqual([]);
    });
  });
});
