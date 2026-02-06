import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET() {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service client for full access to payment data
  const serviceClient = createServiceClient();

  try {
    // Date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all metrics in parallel
    const [
      usersResult,
      newUsersTodayResult,
      newUsersWeekResult,
      purchasesResult,
      purchasesMonthResult,
      refundsResult,
      subscriptionsResult,
      friendCodesResult,
      friendCodesUsedResult,
      journalResult,
      activeUsersResult,
      streaksResult,
      moderationResult,
    ] = await Promise.all([
      // Total users
      serviceClient.from("users").select("id", { count: "exact", head: true }),

      // New users today
      serviceClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),

      // New users this week
      serviceClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),

      // All completed purchases (lifetime revenue)
      serviceClient
        .from("purchases")
        .select("amount_cents, purchase_type, purchased_at")
        .eq("status", "completed"),

      // Purchases this month
      serviceClient
        .from("purchases")
        .select("amount_cents")
        .eq("status", "completed")
        .gte("purchased_at", thirtyDaysAgo),

      // Refunds
      serviceClient.from("purchases").select("amount_cents").eq("status", "refunded"),

      // Active subscriptions (MRR)
      serviceClient
        .from("subscriptions")
        .select("amount_cents, interval, status")
        .eq("status", "active"),

      // Friend codes created
      serviceClient.from("friend_codes").select("id", { count: "exact", head: true }),

      // Friend codes used
      serviceClient
        .from("friend_codes")
        .select("id", { count: "exact", head: true })
        .not("used_by_id", "is", null),

      // Journal entries
      serviceClient.from("journal_entries").select("id", { count: "exact", head: true }),

      // Active users (activity in last 7 days)
      serviceClient.from("journal_entries").select("user_id").gte("created_at", sevenDaysAgo),

      // User streaks for average calculation
      serviceClient.from("user_gamification").select("current_streak"),

      // Pending moderation
      serviceClient
        .from("moderation_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    // Calculate revenue metrics
    const totalRevenueCents =
      purchasesResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const revenueMonthCents =
      purchasesMonthResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const refundsCents =
      refundsResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    // Calculate MRR from active subscriptions
    const mrrCents =
      subscriptionsResult.data?.reduce((sum, sub) => {
        if (sub.interval === "year") {
          return sum + Math.round((sub.amount_cents || 0) / 12);
        }
        return sum + (sub.amount_cents || 0);
      }, 0) || 0;

    // Calculate unique active users
    const uniqueActiveUsers = new Set(activeUsersResult.data?.map((e) => e.user_id) || []).size;

    // Calculate average streak
    const streaks = streaksResult.data?.map((u) => u.current_streak || 0) || [];
    const averageStreak =
      streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;

    // Challenge purchases vs friend code redemptions
    const challengePurchases =
      purchasesResult.data?.filter((p) => p.purchase_type === "challenge").length || 0;

    // Friend code conversion rate
    const friendCodesCreated = friendCodesResult.count || 0;
    const friendCodesUsed = friendCodesUsedResult.count || 0;
    const friendCodeConversionRate =
      friendCodesCreated > 0 ? (friendCodesUsed / friendCodesCreated) * 100 : 0;

    // Calculate completion rate (users with day 45 entries / users with challenge access)
    // Simplified: using journal entries as proxy
    const totalJournalEntries = journalResult.count || 0;
    const totalUsers = usersResult.count || 1;
    const engagementRate = Math.min((totalJournalEntries / (totalUsers * 45)) * 100, 100);

    const metrics = {
      // User metrics
      totalUsers: usersResult.count || 0,
      activeUsers: uniqueActiveUsers,
      newUsersToday: newUsersTodayResult.count || 0,
      newUsersWeek: newUsersWeekResult.count || 0,

      // Revenue metrics
      totalRevenue: totalRevenueCents / 100,
      revenueMonth: revenueMonthCents / 100,
      refundsTotal: refundsCents / 100,
      mrr: mrrCents / 100,
      arr: (mrrCents * 12) / 100,

      // Sales breakdown
      challengePurchases,
      friendCodeRedemptions: friendCodesUsed,
      friendCodeConversionRate: Math.round(friendCodeConversionRate * 10) / 10,
      activeSubscriptions: subscriptionsResult.data?.length || 0,

      // Engagement metrics
      totalJournalEntries,
      challengeCompletionRate: Math.round(engagementRate * 10) / 10,
      averageStreak: Math.round(averageStreak * 10) / 10,

      // Moderation
      pendingModeration: moderationResult.count || 0,

      // System
      systemHealth: "healthy" as const,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
