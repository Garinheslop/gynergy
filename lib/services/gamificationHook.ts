/**
 * Gamification Hook Service
 *
 * Unified helper that wires journal/action completion into the existing
 * points and badge systems. Designed to be non-blocking — errors are
 * logged but never fail the parent request.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkAndAwardBadges } from "@lib/services/badgeService";
import { awardPoints } from "@lib/services/pointsService";
import type {
  ActivityType,
  BadgeCheckContext,
  CelebrationEvent,
} from "@resources/types/gamification";

// ============================================================================
// Types
// ============================================================================

export interface GamificationResult {
  points: number;
  celebrations: CelebrationEvent[];
}

interface GamificationInput {
  supabase: any;
  userId: string;
  sessionId: string;
  activityType: ActivityType;
  sourceId?: string;
  sourceType?: string;
}

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build the full context needed for badge checking by querying the user's
 * current streaks, completion counts, and today's activity status.
 */
async function buildBadgeContext(
  supabase: any,
  userId: string,
  sessionId: string,
  activityType: ActivityType
): Promise<BadgeCheckContext> {
  const now = new Date();

  // Default context — used if any query fails
  const defaultContext: BadgeCheckContext = {
    userId,
    sessionId,
    activityType,
    timestamp: now,
    userTimezone: "America/New_York",
    streaks: { morning: 0, evening: 0, gratitude: 0, combined: 0, weekly: 0 },
    completedToday: { morning: false, evening: false, dga: false },
    totalCounts: { morningJournals: 0, eveningJournals: 0, dgas: 0, shares: 0, encouragements: 0 },
    moodHistory: [],
    dayInJourney: 1,
  };

  try {
    // Get enrollment data (streak count, enrollment date)
    const { data: enrollment } = await supabase
      .from("session_enrollments")
      .select(
        "morning_streak, evening_streak, gratitude_streak, weekly_reflection_streak, enrollment_date"
      )
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .single();

    const morningStreak = enrollment?.morning_streak || 0;
    const eveningStreak = enrollment?.evening_streak || 0;
    const gratitudeStreak = enrollment?.gratitude_streak || 0;
    const combinedStreak = Math.min(morningStreak, eveningStreak, gratitudeStreak);
    const weeklyStreak = enrollment?.weekly_reflection_streak || 0;
    const enrollmentDate = enrollment?.enrollment_date ? new Date(enrollment.enrollment_date) : now;
    const dayInJourney = Math.max(
      1,
      Math.ceil((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get today's date string for completion checks
    const todayStr = now.toISOString().split("T")[0];

    // Query today's completions in parallel
    const [journalsResult, actionsResult, countsResult] = await Promise.all([
      // Today's journals
      supabase
        .from("journals")
        .select("journal_type")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("is_completed", true)
        .gte("created_at", `${todayStr}T00:00:00`)
        .lt("created_at", `${todayStr}T23:59:59`),

      // Today's action logs
      supabase
        .from("action_logs")
        .select("action_type")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("is_completed", true)
        .gte("created_at", `${todayStr}T00:00:00`)
        .lt("created_at", `${todayStr}T23:59:59`),

      // Total counts (all time)
      Promise.all([
        supabase
          .from("journals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .eq("journal_type", "morning")
          .eq("is_completed", true),
        supabase
          .from("journals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .eq("journal_type", "evening")
          .eq("is_completed", true),
        supabase
          .from("action_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .eq("action_type", "gratitude")
          .eq("is_completed", true),
      ]),
    ]);

    const todayJournals = journalsResult.data || [];
    const todayActions = actionsResult.data || [];
    const [morningCount, eveningCount, dgaCount] = countsResult;

    const hasMorningToday = todayJournals.some((j: any) => j.journal_type === "morning");
    const hasEveningToday = todayJournals.some((j: any) => j.journal_type === "evening");
    const hasDgaToday = todayActions.some((a: any) => a.action_type === "gratitude");

    return {
      userId,
      sessionId,
      activityType,
      timestamp: now,
      userTimezone: "America/New_York",
      streaks: {
        morning: morningStreak,
        evening: eveningStreak,
        gratitude: gratitudeStreak,
        combined: combinedStreak,
        weekly: weeklyStreak,
      },
      completedToday: {
        morning: hasMorningToday,
        evening: hasEveningToday,
        dga: hasDgaToday,
      },
      totalCounts: {
        morningJournals: morningCount.count || 0,
        eveningJournals: eveningCount.count || 0,
        dgas: dgaCount.count || 0,
        shares: 0,
        encouragements: 0,
      },
      moodHistory: [],
      dayInJourney,
    };
  } catch (error) {
    console.error("[gamification] Error building badge context:", error);
    return defaultContext;
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Process gamification for a completed activity.
 *
 * This is completely non-blocking: errors are caught, logged, and a safe
 * default is returned so the parent request never fails due to gamification.
 */
export async function processGamification(input: GamificationInput): Promise<GamificationResult> {
  const safeResult: GamificationResult = { points: 0, celebrations: [] };

  try {
    const { supabase, userId, sessionId, activityType, sourceId, sourceType } = input;

    // Build context for badge checking (includes today's completions)
    const context = await buildBadgeContext(supabase, userId, sessionId, activityType);

    // Award points
    const pointsResult = await awardPoints(supabase, {
      userId,
      sessionId,
      activityType,
      sourceId,
      sourceType,
      timestamp: new Date(),
      completedToday: context.completedToday,
    });

    if (pointsResult.error) {
      console.error("[gamification] Points error:", pointsResult.error);
    }

    // Check and award badges
    const badgeResult = await checkAndAwardBadges(supabase, context);

    // Combine celebrations
    const celebrations: CelebrationEvent[] = [...badgeResult.celebrationEvents];

    // Add points celebration if significant
    const totalPoints = pointsResult.points.finalPoints + badgeResult.pointsAwarded;
    if (totalPoints > 0) {
      celebrations.push({
        id: `points-${Date.now()}`,
        type: "points",
        priority: 10,
        data: {
          points: totalPoints,
          message: `+${totalPoints} points earned!`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Sort by priority (highest first)
    celebrations.sort((a, b) => b.priority - a.priority);

    return {
      points: totalPoints,
      celebrations,
    };
  } catch (error) {
    console.error("[gamification] Hook error:", error);
    return safeResult;
  }
}

// ============================================================================
// Activity Type Helpers
// ============================================================================

/**
 * Map journal request types to gamification activity types
 */
export function journalToActivityType(requestType: string): ActivityType | null {
  switch (requestType) {
    case "create-morning-journal":
      return "morning_journal";
    case "create-evening-journal":
      return "evening_journal";
    case "create-weekly-journal":
      return "weekly_journal";
    default:
      return null;
  }
}

/**
 * Map action request types to gamification activity types
 */
export function actionToActivityType(requestType: string): ActivityType | null {
  switch (requestType) {
    case "complete-daily-action":
      return "dga";
    default:
      return null;
  }
}
