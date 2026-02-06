// Admin Alerts Service
// Detects anomalies and generates automated alerts for the dashboard

import { SupabaseClient } from "@supabase/supabase-js";

export interface Alert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AlertCheck {
  check: (supabase: SupabaseClient) => Promise<Alert | null>;
  priority: number; // Lower = higher priority
}

// Revenue drop detection
export async function checkRevenueDrop(supabase: SupabaseClient): Promise<Alert | null> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [todayResult, yesterdayResult] = await Promise.all([
    supabase
      .from("purchases")
      .select("amount_cents")
      .eq("status", "completed")
      .gte("purchased_at", todayStart),
    supabase
      .from("purchases")
      .select("amount_cents")
      .eq("status", "completed")
      .gte("purchased_at", yesterdayStart.toISOString())
      .lt("purchased_at", todayStart),
  ]);

  const todayRevenue = todayResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
  const yesterdayRevenue =
    yesterdayResult.data?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

  // Alert if revenue dropped more than 50% compared to yesterday
  if (yesterdayRevenue > 0 && todayRevenue < yesterdayRevenue * 0.5) {
    const dropPercent = Math.round((1 - todayRevenue / yesterdayRevenue) * 100);
    return {
      id: `revenue-drop-${now.toISOString().split("T")[0]}`,
      type: "warning",
      title: `Revenue Down ${dropPercent}% Today`,
      description: `Today's revenue ($${(todayRevenue / 100).toLocaleString()}) is significantly lower than yesterday ($${(yesterdayRevenue / 100).toLocaleString()})`,
      actionLabel: "View Analytics",
      actionHref: "/admin/payments",
      createdAt: now.toISOString(),
      metadata: { todayRevenue, yesterdayRevenue, dropPercent },
    };
  }

  return null;
}

// High refund rate detection
export async function checkRefundRate(supabase: SupabaseClient): Promise<Alert | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [completedResult, refundedResult] = await Promise.all([
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("status", "refunded")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const completed = completedResult.count || 0;
  const refunded = refundedResult.count || 0;
  const total = completed + refunded;

  if (total > 5) {
    // Only check if we have enough data
    const refundRate = (refunded / total) * 100;

    if (refundRate > 5) {
      // Alert if refund rate exceeds 5%
      return {
        id: `high-refunds-${new Date().toISOString().split("T")[0]}`,
        type: "error",
        title: `High Refund Rate: ${refundRate.toFixed(1)}%`,
        description: `${refunded} refunds out of ${total} purchases in the last 30 days. Industry average is below 3%.`,
        actionLabel: "Review Refunds",
        actionHref: "/admin/payments",
        createdAt: new Date().toISOString(),
        metadata: { refundRate, refunded, total },
      };
    }
  }

  return null;
}

// Subscription churn detection
export async function checkSubscriptionChurn(supabase: SupabaseClient): Promise<Alert | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeResult, canceledResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("canceled_at", sevenDaysAgo),
  ]);

  const active = activeResult.count || 0;
  const churned = canceledResult.count || 0;

  if (active > 0 && churned > 0) {
    const churnRate = (churned / (active + churned)) * 100;

    if (churnRate > 10) {
      // Alert if weekly churn exceeds 10%
      return {
        id: `subscription-churn-${new Date().toISOString().split("T")[0]}`,
        type: "warning",
        title: `${churned} Subscriptions Canceled This Week`,
        description: `Weekly churn rate is ${churnRate.toFixed(1)}%. Consider reaching out to churned users.`,
        actionLabel: "View Subscriptions",
        actionHref: "/admin/payments",
        createdAt: new Date().toISOString(),
        metadata: { churnRate, churned, active },
      };
    }
  }

  return null;
}

// Moderation queue backup
export async function checkModerationBacklog(supabase: SupabaseClient): Promise<Alert | null> {
  const { count } = await supabase
    .from("moderation_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (count && count > 10) {
    return {
      id: `moderation-backlog-${new Date().toISOString().split("T")[0]}`,
      type: "info",
      title: `${count} Items in Moderation Queue`,
      description:
        "Community posts are waiting for review. Consider addressing high-priority items first.",
      actionLabel: "Review Now",
      actionHref: "/admin/community",
      createdAt: new Date().toISOString(),
      metadata: { pendingCount: count },
    };
  }

  return null;
}

// Friend code performance
export async function checkFriendCodePerformance(supabase: SupabaseClient): Promise<Alert | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [createdResult, usedResult] = await Promise.all([
    supabase
      .from("friend_codes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("friend_codes")
      .select("id", { count: "exact", head: true })
      .gte("used_at", thirtyDaysAgo)
      .not("used_by_id", "is", null),
  ]);

  const created = createdResult.count || 0;
  const used = usedResult.count || 0;

  if (created > 10) {
    const conversionRate = (used / created) * 100;

    if (conversionRate > 50) {
      return {
        id: `friend-code-success-${new Date().toISOString().split("T")[0]}`,
        type: "success",
        title: `Friend Codes Performing Well: ${conversionRate.toFixed(0)}% Conversion`,
        description: `${used} of ${created} friend codes were redeemed this month. Your referral program is working!`,
        actionLabel: "View Details",
        actionHref: "/admin/analytics",
        createdAt: new Date().toISOString(),
        metadata: { conversionRate, used, created },
      };
    } else if (conversionRate < 20) {
      return {
        id: `friend-code-low-${new Date().toISOString().split("T")[0]}`,
        type: "info",
        title: `Friend Code Conversion: ${conversionRate.toFixed(0)}%`,
        description: `Only ${used} of ${created} friend codes redeemed. Consider reminding users to share their codes.`,
        actionLabel: "View Analytics",
        actionHref: "/admin/analytics",
        createdAt: new Date().toISOString(),
        metadata: { conversionRate, used, created },
      };
    }
  }

  return null;
}

// Run all alert checks
export async function runAllAlertChecks(supabase: SupabaseClient): Promise<Alert[]> {
  const checks = [
    checkRevenueDrop,
    checkRefundRate,
    checkSubscriptionChurn,
    checkModerationBacklog,
    checkFriendCodePerformance,
  ];

  const results = await Promise.all(checks.map((check) => check(supabase)));

  return results.filter((alert): alert is Alert => alert !== null);
}

// Store alert in database for persistence
export async function storeAlert(supabase: SupabaseClient, alert: Alert): Promise<void> {
  await supabase.from("system_metrics").upsert(
    {
      metric_name: `alert_${alert.id}`,
      metric_category: "alerts",
      value: 1,
      dimensions: {
        type: alert.type,
        title: alert.title,
        description: alert.description,
        actionLabel: alert.actionLabel,
        actionHref: alert.actionHref,
        ...alert.metadata,
      },
      recorded_at: alert.createdAt,
      aggregation_period: "daily",
    },
    {
      onConflict: "metric_name",
    }
  );
}
