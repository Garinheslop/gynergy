import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(request: NextRequest) {
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

  const serviceClient = createServiceClient();
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "30d";

  try {
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const rangeStart =
      range === "7d" ? sevenDaysAgo : range === "90d" ? ninetyDaysAgo : thirtyDaysAgo;

    // Fetch all payment data
    const [
      allPurchases,
      purchasesToday,
      purchasesYesterday,
      purchasesRange,
      refunds,
      subscriptions,
      friendCodes,
    ] = await Promise.all([
      // All completed purchases
      serviceClient
        .from("purchases")
        .select("id, user_id, amount_cents, purchase_type, status, purchased_at, created_at")
        .eq("status", "completed")
        .order("purchased_at", { ascending: false }),

      // Today's purchases
      serviceClient
        .from("purchases")
        .select("amount_cents")
        .eq("status", "completed")
        .gte("purchased_at", todayStart),

      // Yesterday's purchases (for comparison)
      serviceClient
        .from("purchases")
        .select("amount_cents")
        .eq("status", "completed")
        .gte("purchased_at", yesterdayStart)
        .lt("purchased_at", todayStart),

      // Purchases in selected range
      serviceClient
        .from("purchases")
        .select("id, amount_cents, purchase_type, purchased_at")
        .eq("status", "completed")
        .gte("purchased_at", rangeStart)
        .order("purchased_at", { ascending: true }),

      // Refunds
      serviceClient.from("purchases").select("amount_cents, refunded_at").eq("status", "refunded"),

      // Active subscriptions
      serviceClient
        .from("subscriptions")
        .select("id, user_id, amount_cents, interval, status, current_period_end, created_at")
        .eq("status", "active"),

      // Friend codes
      serviceClient.from("friend_codes").select("id, used_by_id, used_at, created_at"),
    ]);

    // Calculate totals
    const totalRevenue = allPurchases.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const revenueToday =
      purchasesToday.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const revenueYesterday =
      purchasesYesterday.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const revenueRange =
      purchasesRange.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    const refundsTotal = refunds.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

    // Calculate MRR from active subscriptions
    const mrr =
      subscriptions.data?.reduce((sum, sub) => {
        if (sub.interval === "year") {
          return sum + Math.round((sub.amount_cents || 0) / 12);
        }
        return sum + (sub.amount_cents || 0);
      }, 0) || 0;

    // Calculate refund rate
    const completedCount = allPurchases.data?.length || 0;
    const refundCount = refunds.data?.length || 0;
    const refundRate =
      completedCount > 0 ? (refundCount / (completedCount + refundCount)) * 100 : 0;

    // Challenge vs friend code breakdown
    const challengePurchases =
      allPurchases.data?.filter((p) => p.purchase_type === "challenge") || [];
    const challengeRevenue = challengePurchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

    // Friend code stats
    const friendCodesCreated = friendCodes.data?.length || 0;
    const friendCodesUsed = friendCodes.data?.filter((fc) => fc.used_by_id).length || 0;
    const friendCodeConversionRate =
      friendCodesCreated > 0 ? (friendCodesUsed / friendCodesCreated) * 100 : 0;

    // Generate revenue trend data
    const revenueTrend = generateRevenueTrend(purchasesRange.data || [], range);

    // Daily comparison
    const dailyChange =
      revenueYesterday > 0
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
        : revenueToday > 0
          ? 100
          : 0;

    const metrics = {
      // Revenue totals (convert from cents)
      totalRevenue: totalRevenue / 100,
      revenueToday: revenueToday / 100,
      revenueRange: revenueRange / 100,
      mrr: mrr / 100,
      arr: (mrr * 12) / 100,

      // Comparisons
      dailyChange: Math.round(dailyChange * 10) / 10,

      // Refunds
      refundsTotal: refundsTotal / 100,
      refundCount,
      refundRate: Math.round(refundRate * 10) / 10,

      // Sales breakdown
      challengePurchases: challengePurchases.length,
      challengeRevenue: challengeRevenue / 100,
      friendCodeRedemptions: friendCodesUsed,
      activeSubscriptions: subscriptions.data?.length || 0,
      subscriptionRevenue: mrr / 100,

      // Friend codes
      friendCodesCreated,
      friendCodesUsed,
      friendCodeConversionRate: Math.round(friendCodeConversionRate * 10) / 10,

      // Trends
      revenueTrend,

      // Recent purchases (last 10)
      recentPurchases: (allPurchases.data || []).slice(0, 10).map((p) => ({
        id: p.id,
        type: p.purchase_type,
        amount: (p.amount_cents || 0) / 100,
        date: p.purchased_at,
      })),
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      range,
    });
  } catch (error) {
    console.error("Error fetching payment analytics:", error);
    return NextResponse.json({ error: "Failed to fetch payment data" }, { status: 500 });
  }
}

// Generate revenue trend grouped by day/week
function generateRevenueTrend(
  purchases: Array<{ amount_cents: number; purchased_at: string | null }>,
  range: string
): Array<{ name: string; value: number }> {
  const groupBy = range === "90d" ? "week" : "day";
  const groups = new Map<string, number>();

  for (const purchase of purchases) {
    if (!purchase.purchased_at) continue;

    const date = new Date(purchase.purchased_at);
    let key: string;

    if (groupBy === "week") {
      // Group by week (Monday start)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = date.toISOString().split("T")[0];
    }

    groups.set(key, (groups.get(key) || 0) + (purchase.amount_cents || 0));
  }

  // Sort by date and format
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, cents]) => ({
      name: formatDateLabel(date, groupBy),
      value: cents / 100,
    }));
}

function formatDateLabel(dateStr: string, groupBy: string): string {
  const date = new Date(dateStr);
  if (groupBy === "week") {
    return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
