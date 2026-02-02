/**
 * Points Service
 * Handles points calculation, multipliers, and transaction logging
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import camelcaseKeys from "camelcase-keys";

import {
  ActivityType,
  MultiplierConfig,
  PointsTransaction,
  PointsCalculationInput,
  PointsCalculationResult,
  BASE_POINTS,
} from "@resources/types/gamification";

/**
 * Get base points for an activity type
 */
export function getBasePoints(activityType: ActivityType): number {
  return BASE_POINTS[activityType] || 0;
}

/**
 * Get the active streak multiplier based on current streak
 */
export function getStreakMultiplier(streak: number): {
  value: number;
  name: string;
} {
  if (streak >= 30) {
    return { value: 2.0, name: "Streak 30+" };
  } else if (streak >= 14) {
    return { value: 1.5, name: "Streak 14-29" };
  } else if (streak >= 7) {
    return { value: 1.2, name: "Streak 7-13" };
  }
  return { value: 1.0, name: "No multiplier" };
}

/**
 * Calculate combo bonus points
 */
export function getComboBonus(hasCombo: boolean): number {
  return hasCombo ? 10 : 0;
}

/**
 * Calculate early bird bonus points
 */
export function getEarlyBirdBonus(
  activityType: ActivityType,
  isEarlyBird: boolean
): number {
  // Early bird bonus only applies to morning journal
  if (activityType === "morning_journal" && isEarlyBird) {
    return 5;
  }
  return 0;
}

/**
 * Calculate total points for an activity
 */
export function calculatePoints(
  input: PointsCalculationInput
): PointsCalculationResult {
  const { activityType, basePoints, streak, hasCombo, isEarlyBird } = input;

  // Get multiplier
  const multiplier = getStreakMultiplier(streak);

  // Calculate bonuses
  const comboBonus = getComboBonus(hasCombo);
  const earlyBirdBonus = getEarlyBirdBonus(activityType, isEarlyBird);
  const totalBonus = comboBonus + earlyBirdBonus;

  // Calculate final points: (base * multiplier) + bonuses
  const multipliedPoints = Math.floor(basePoints * multiplier.value);
  const finalPoints = multipliedPoints + totalBonus;

  // Track which multipliers were applied
  const appliedMultipliers: string[] = [];
  if (multiplier.value > 1) {
    appliedMultipliers.push(multiplier.name);
  }
  if (comboBonus > 0) {
    appliedMultipliers.push("Daily Combo (+10)");
  }
  if (earlyBirdBonus > 0) {
    appliedMultipliers.push("Early Bird (+5)");
  }

  return {
    basePoints,
    multiplier: multiplier.value,
    bonusPoints: totalBonus,
    finalPoints,
    appliedMultipliers,
  };
}

/**
 * Log a points transaction to the database
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logPointsTransaction(
  supabase: any,
  transaction: {
    userId: string;
    sessionId: string;
    activityType: ActivityType;
    basePoints: number;
    multiplier: number;
    bonusPoints: number;
    finalPoints: number;
    sourceId?: string;
    sourceType?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ transaction: PointsTransaction | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .insert({
        user_id: transaction.userId,
        session_id: transaction.sessionId,
        activity_type: transaction.activityType,
        base_points: transaction.basePoints,
        multiplier: transaction.multiplier,
        bonus_points: transaction.bonusPoints,
        final_points: transaction.finalPoints,
        source_id: transaction.sourceId || null,
        source_type: transaction.sourceType || null,
        metadata: transaction.metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging points transaction:", error);
      return { transaction: null, error: error.message };
    }

    return { transaction: camelcaseKeys(data, { deep: true }) };
  } catch (error: any) {
    console.error("Error in logPointsTransaction:", error);
    return { transaction: null, error: error.message };
  }
}

/**
 * Get points history for a user in a session
 */
export async function getPointsHistory(
  supabase: any,
  userId: string,
  sessionId: string,
  limit: number = 50
): Promise<{ transactions: PointsTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { transactions: [], error: error.message };
    }

    return { transactions: camelcaseKeys(data || [], { deep: true }) };
  } catch (error: any) {
    return { transactions: [], error: error.message };
  }
}

/**
 * Get total points for a user in a session
 */
export async function getTotalPoints(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ total: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .select("final_points")
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) {
      return { total: 0, error: error.message };
    }

    const total = (data || []).reduce(
      (sum: number, t: any) => sum + (t.final_points || 0),
      0
    );

    return { total };
  } catch (error: any) {
    return { total: 0, error: error.message };
  }
}

/**
 * Get all active multiplier configurations
 */
export async function getMultiplierConfigs(
  supabase: any
): Promise<{ multipliers: MultiplierConfig[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("multiplier_configs")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return { multipliers: [], error: error.message };
    }

    return { multipliers: camelcaseKeys(data || [], { deep: true }) };
  } catch (error: any) {
    return { multipliers: [], error: error.message };
  }
}

/**
 * Get the active multiplier for a user based on their streak
 */
export async function getActiveMultiplierForUser(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{
  multiplier: { value: number; name: string } | null;
  streak: number;
  error?: string;
}> {
  try {
    // Get user's current streak from session enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("session_enrollments")
      .select("streak_count")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .single();

    if (enrollmentError) {
      return { multiplier: null, streak: 0, error: enrollmentError.message };
    }

    const streak = enrollment?.streak_count || 0;
    const multiplier = getStreakMultiplier(streak);

    if (multiplier.value === 1.0) {
      return { multiplier: null, streak };
    }

    return { multiplier, streak };
  } catch (error: any) {
    return { multiplier: null, streak: 0, error: error.message };
  }
}

/**
 * Award points for completing an activity
 * This is the main entry point for awarding points
 */
export async function awardPoints(
  supabase: any,
  params: {
    userId: string;
    sessionId: string;
    activityType: ActivityType;
    sourceId?: string;
    sourceType?: string;
    timestamp?: Date;
    completedToday?: {
      morning: boolean;
      evening: boolean;
      dga: boolean;
    };
  }
): Promise<{
  points: PointsCalculationResult;
  transaction: PointsTransaction | null;
  error?: string;
}> {
  try {
    const {
      userId,
      sessionId,
      activityType,
      sourceId,
      sourceType,
      timestamp = new Date(),
      completedToday = { morning: false, evening: false, dga: false },
    } = params;

    // Get user's current streak
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("session_enrollments")
      .select("streak_count")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .single();

    if (enrollmentError) {
      return {
        points: {
          basePoints: 0,
          multiplier: 1,
          bonusPoints: 0,
          finalPoints: 0,
          appliedMultipliers: [],
        },
        transaction: null,
        error: enrollmentError.message,
      };
    }

    const streak = enrollment?.streak_count || 0;

    // Check if user has combo (all three activities today)
    const hasCombo =
      completedToday.morning && completedToday.evening && completedToday.dga;

    // Check if early bird (before 8am for morning journal)
    const hour = timestamp.getHours();
    const isEarlyBird = activityType === "morning_journal" && hour < 8;

    // Calculate points
    const basePoints = getBasePoints(activityType);
    const pointsResult = calculatePoints({
      activityType,
      basePoints,
      streak,
      hasCombo,
      isEarlyBird,
    });

    // Log the transaction
    const { transaction, error: transactionError } = await logPointsTransaction(
      supabase,
      {
        userId,
        sessionId,
        activityType,
        basePoints: pointsResult.basePoints,
        multiplier: pointsResult.multiplier,
        bonusPoints: pointsResult.bonusPoints,
        finalPoints: pointsResult.finalPoints,
        sourceId,
        sourceType,
        metadata: {
          streak,
          hasCombo,
          isEarlyBird,
          appliedMultipliers: pointsResult.appliedMultipliers,
        },
      }
    );

    if (transactionError) {
      return { points: pointsResult, transaction: null, error: transactionError };
    }

    return { points: pointsResult, transaction };
  } catch (error: any) {
    return {
      points: {
        basePoints: 0,
        multiplier: 1,
        bonusPoints: 0,
        finalPoints: 0,
        appliedMultipliers: [],
      },
      transaction: null,
      error: error.message,
    };
  }
}
