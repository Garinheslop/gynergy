/**
 * Badge Service
 * Handles badge checking, awarding, and management
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import camelcaseKeys from "camelcase-keys";
import { v4 as uuidv4 } from "uuid";

import {
  Badge,
  UserBadge,
  BadgeCheckContext,
  BadgeCheckResult,
  CelebrationEvent,
  StreakCondition,
  FirstCondition,
  ComboCondition,
  TimeCondition,
  ShareCondition,
  EncourageCondition,
  MilestoneCondition,
  ComebackCondition,
  WeekendCondition,
  MoodCondition,
  CompleteCondition,
} from "@resources/types/gamification";

/**
 * Check if a streak condition is met
 */
function checkStreakCondition(condition: StreakCondition, context: BadgeCheckContext): boolean {
  const { activity, count } = condition;

  switch (activity) {
    case "morning":
      return context.streaks.morning >= count;
    case "evening":
      return context.streaks.evening >= count;
    case "gratitude":
      return context.streaks.gratitude >= count;
    case "all":
      return context.streaks.combined >= count;
    case "weekly":
      return context.streaks.weekly >= count;
    default:
      return false;
  }
}

/**
 * Check if a first-time condition is met
 */
function checkFirstCondition(condition: FirstCondition, context: BadgeCheckContext): boolean {
  const { activity } = condition;

  switch (activity) {
    case "morning":
      return context.totalCounts.morningJournals === 1;
    case "evening":
      return context.totalCounts.eveningJournals === 1;
    case "dga":
      return context.totalCounts.dgas === 1;
    default:
      return false;
  }
}

/**
 * Check if a combo condition is met
 */
function checkComboCondition(condition: ComboCondition, context: BadgeCheckContext): boolean {
  const { activities, count = 1 } = condition;

  // Check if all specified activities are completed today
  const allCompletedToday = activities.every((activity) => {
    switch (activity) {
      case "morning":
        return context.completedToday.morning;
      case "evening":
        return context.completedToday.evening;
      case "dga":
        return context.completedToday.dga;
      default:
        return false;
    }
  });

  if (count === 1) {
    return allCompletedToday;
  }

  // For count > 1, this is checked via streak
  return context.streaks.combined >= count;
}

/**
 * Check if a time-based condition is met
 */
function checkTimeCondition(condition: TimeCondition, context: BadgeCheckContext): boolean {
  const { activity: _activity, before, after, count = 1 } = condition;

  // Parse the timestamp in user's timezone
  const hour = context.timestamp.getHours();
  const minute = context.timestamp.getMinutes();
  const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  // Check time bounds
  if (before && timeStr >= before) {
    return false;
  }
  if (after && timeStr < after) {
    return false;
  }

  // For count > 1, we'd need to track historical early completions
  // This would require additional database queries
  // For now, return true for the first occurrence
  if (count > 1) {
    // This needs to be tracked separately in the database
    // Return false for now - will be enhanced with proper tracking
    return false;
  }

  return true;
}

/**
 * Check if a share condition is met
 */
function checkShareCondition(condition: ShareCondition, context: BadgeCheckContext): boolean {
  return context.totalCounts.shares >= condition.count;
}

/**
 * Check if an encourage condition is met
 */
function checkEncourageCondition(
  condition: EncourageCondition,
  context: BadgeCheckContext
): boolean {
  return context.totalCounts.encouragements >= condition.count;
}

/**
 * Check if a milestone condition is met
 */
function checkMilestoneCondition(
  condition: MilestoneCondition,
  context: BadgeCheckContext
): boolean {
  return context.milestone === condition.number;
}

/**
 * Check if a comeback condition is met
 */
function checkComebackCondition(condition: ComebackCondition, context: BadgeCheckContext): boolean {
  if (!context.lastJournalDate) {
    return false;
  }

  const lastDate = new Date(context.lastJournalDate);
  const today = new Date(context.timestamp);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= condition.days_away;
}

/**
 * Check if a weekend condition is met
 */
function checkWeekendCondition(_condition: WeekendCondition, context: BadgeCheckContext): boolean {
  const dayOfWeek = context.timestamp.getDay();
  const isSunday = dayOfWeek === 0;

  // Must be Sunday to check weekend completion
  if (!isSunday) {
    return false;
  }

  // Check that all activities were completed both Saturday and Sunday
  // This requires historical data - for now, check if combined streak >= 2
  // and it's Sunday with all activities done
  return (
    context.streaks.combined >= 2 &&
    context.completedToday.morning &&
    context.completedToday.evening &&
    context.completedToday.dga
  );
}

/**
 * Check if a mood improvement condition is met
 */
function checkMoodCondition(condition: MoodCondition, context: BadgeCheckContext): boolean {
  const { moodHistory } = context;

  if (moodHistory.length < condition.count + 1) {
    return false;
  }

  // Count days with mood improvement
  let improvementDays = 0;
  for (let i = 1; i < moodHistory.length; i++) {
    if (moodHistory[i].score > moodHistory[i - 1].score) {
      improvementDays++;
    }
  }

  return improvementDays >= condition.count;
}

/**
 * Check if a complete/graduate condition is met
 */
function checkCompleteCondition(condition: CompleteCondition, context: BadgeCheckContext): boolean {
  if (condition.type === "graduate") {
    return context.dayInJourney >= 45 && context.streaks.combined >= 45;
  }

  // For other completion types, would need to check specific data
  // This is a placeholder for vision/journey completion
  return false;
}

/**
 * Check if a badge unlock condition is met
 */
export function checkBadgeCondition(badge: Badge, context: BadgeCheckContext): boolean {
  const condition = badge.unlockCondition;

  switch (condition.type) {
    case "streak":
      return checkStreakCondition(condition as StreakCondition, context);
    case "first":
      return checkFirstCondition(condition as FirstCondition, context);
    case "combo":
      return checkComboCondition(condition as ComboCondition, context);
    case "time":
      return checkTimeCondition(condition as TimeCondition, context);
    case "share":
      return checkShareCondition(condition as ShareCondition, context);
    case "encourage":
      return checkEncourageCondition(condition as EncourageCondition, context);
    case "milestone":
      return checkMilestoneCondition(condition as MilestoneCondition, context);
    case "comeback":
      return checkComebackCondition(condition as ComebackCondition, context);
    case "weekend":
      return checkWeekendCondition(condition as WeekendCondition, context);
    case "mood":
      return checkMoodCondition(condition as MoodCondition, context);
    case "complete":
    case "graduate":
      return checkCompleteCondition(condition as CompleteCondition, context);
    default:
      return false;
  }
}

/**
 * Create a celebration event for a newly unlocked badge
 */
function createBadgeCelebration(badge: Badge, userBadge: UserBadge): CelebrationEvent {
  // Determine priority based on rarity
  const priorityMap: Record<string, number> = {
    legendary: 100,
    epic: 80,
    rare: 60,
    uncommon: 40,
    common: 20,
  };

  return {
    id: uuidv4(),
    type: "badge",
    priority: priorityMap[badge.rarity] || 20,
    data: {
      badge,
      userBadge,
      points: badge.pointsReward,
      message: `You earned the ${badge.name} badge!`,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check all badges and return newly unlocked ones
 */
export async function checkAndAwardBadges(
  supabase: any,
  context: BadgeCheckContext
): Promise<BadgeCheckResult> {
  const result: BadgeCheckResult = {
    newBadges: [],
    pointsAwarded: 0,
    celebrationEvents: [],
  };

  try {
    // Get all badge definitions
    const { data: allBadges, error: badgesError } = await supabase
      .from("badges")
      .select("*")
      .order("sort_order", { ascending: true });

    if (badgesError || !allBadges) {
      console.error("Error fetching badges:", badgesError);
      return result;
    }

    // Get user's already earned badges for this session
    const { data: earnedBadges, error: earnedError } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", context.userId)
      .eq("session_id", context.sessionId);

    if (earnedError) {
      console.error("Error fetching earned badges:", earnedError);
      return result;
    }

    const earnedBadgeIds = new Set(earnedBadges?.map((b: any) => b.badge_id) || []);

    // Convert to camelCase and type
    const badges: Badge[] = camelcaseKeys(allBadges, { deep: true });

    // Check each badge
    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge.id)) {
        continue;
      }

      // Skip hidden badges for now (they have special unlock logic)
      if (badge.isHidden) {
        continue;
      }

      // Check if condition is met
      if (checkBadgeCondition(badge, context)) {
        // Award the badge
        const { data: insertedBadge, error: insertError } = await supabase
          .from("user_badges")
          .insert({
            user_id: context.userId,
            badge_id: badge.id,
            session_id: context.sessionId,
            is_new: true,
            is_showcased: false,
          })
          .select()
          .single();

        if (insertError) {
          // Could be a duplicate - skip
          console.error("Error inserting badge:", insertError);
          continue;
        }

        const fullUserBadge = {
          ...camelcaseKeys(insertedBadge, { deep: true }),
          badge,
        } as UserBadge;

        result.newBadges.push(badge);
        result.pointsAwarded += badge.pointsReward;
        result.celebrationEvents.push(createBadgeCelebration(badge, fullUserBadge));
      }
    }

    // Sort celebration events by priority (highest first)
    result.celebrationEvents.sort((a, b) => b.priority - a.priority);

    return result;
  } catch (error) {
    console.error("Error in checkAndAwardBadges:", error);
    return result;
  }
}

/**
 * Get all badges for a user in a session
 */
export async function getUserBadges(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ badges: UserBadge[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badge:badges(*)
      `
      )
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("unlocked_at", { ascending: false });

    if (error) {
      return { badges: [], error: error.message };
    }

    return { badges: camelcaseKeys(data || [], { deep: true }) };
  } catch (error: any) {
    return { badges: [], error: error.message };
  }
}

/**
 * Get all badge definitions
 */
export async function getAllBadges(supabase: any): Promise<{ badges: Badge[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return { badges: [], error: error.message };
    }

    return { badges: camelcaseKeys(data || [], { deep: true }) };
  } catch (error: any) {
    return { badges: [], error: error.message };
  }
}

/**
 * Get new (unseen) badges for a user
 */
export async function getNewBadges(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ badges: UserBadge[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badge:badges(*)
      `
      )
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("is_new", true)
      .order("unlocked_at", { ascending: false });

    if (error) {
      return { badges: [], error: error.message };
    }

    return { badges: camelcaseKeys(data || [], { deep: true }) };
  } catch (error: any) {
    return { badges: [], error: error.message };
  }
}

/**
 * Mark a badge as seen (no longer new)
 */
export async function markBadgeSeen(
  supabase: any,
  userId: string,
  badgeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("user_badges")
      .update({ is_new: false })
      .eq("user_id", userId)
      .eq("badge_id", badgeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggle badge showcase status
 */
export async function toggleBadgeShowcase(
  supabase: any,
  userId: string,
  badgeId: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from("user_badges")
      .select("is_showcased")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .eq("session_id", sessionId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // If trying to showcase, check if user already has 3 showcased
    if (!current.is_showcased) {
      const { data: showcased, error: countError } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("is_showcased", true);

      if (countError) {
        return { success: false, error: countError.message };
      }

      if (showcased && showcased.length >= 3) {
        return { success: false, error: "Maximum 3 badges can be showcased" };
      }
    }

    // Toggle
    const { error: updateError } = await supabase
      .from("user_badges")
      .update({ is_showcased: !current.is_showcased })
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .eq("session_id", sessionId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
