// Aria Proactive Insights Engine
// Automatically generates insights based on platform data patterns

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Insight {
  id: string;
  type: "growth" | "revenue" | "engagement" | "risk" | "opportunity";
  priority: "high" | "medium" | "low";
  title: string;
  summary: string;
  details: string;
  metrics?: Record<string, number | string>;
  suggestedActions: string[];
  generatedAt: string;
}

/**
 * Generate proactive insights based on platform data
 */
export async function generateInsights(supabase: SupabaseClient): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();

  try {
    // Fetch data for analysis
    const [userGrowthData, revenueData, engagementData, streakData, churnRiskData] =
      await Promise.all([
        analyzeUserGrowth(supabase),
        analyzeRevenue(supabase),
        analyzeEngagement(supabase),
        analyzeStreaks(supabase),
        identifyChurnRisk(supabase),
      ]);

    // User Growth Insights
    if (userGrowthData) {
      if (userGrowthData.weekOverWeekGrowth > 15) {
        insights.push({
          id: `growth-${now.getTime()}`,
          type: "growth",
          priority: "high",
          title: "Strong User Growth",
          summary: `User signups are up ${userGrowthData.weekOverWeekGrowth.toFixed(1)}% week-over-week`,
          details: `You've added ${userGrowthData.newUsersThisWeek} new users this week compared to ${userGrowthData.newUsersLastWeek} last week. This acceleration suggests your marketing efforts are working.`,
          metrics: {
            newUsersThisWeek: userGrowthData.newUsersThisWeek,
            newUsersLastWeek: userGrowthData.newUsersLastWeek,
            growthRate: `${userGrowthData.weekOverWeekGrowth.toFixed(1)}%`,
          },
          suggestedActions: [
            "Consider scaling marketing spend while growth is hot",
            "Review top acquisition channels to double down",
            "Ensure onboarding can handle increased volume",
          ],
          generatedAt: now.toISOString(),
        });
      } else if (userGrowthData.weekOverWeekGrowth < -10) {
        insights.push({
          id: `growth-decline-${now.getTime()}`,
          type: "risk",
          priority: "high",
          title: "User Growth Declining",
          summary: `User signups dropped ${Math.abs(userGrowthData.weekOverWeekGrowth).toFixed(1)}% week-over-week`,
          details: `Only ${userGrowthData.newUsersThisWeek} new users this week vs ${userGrowthData.newUsersLastWeek} last week. Consider investigating marketing channels and landing page performance.`,
          metrics: {
            newUsersThisWeek: userGrowthData.newUsersThisWeek,
            newUsersLastWeek: userGrowthData.newUsersLastWeek,
          },
          suggestedActions: [
            "Review marketing campaign performance",
            "Check for technical issues on signup flow",
            "Analyze competitor activity",
          ],
          generatedAt: now.toISOString(),
        });
      }
    }

    // Revenue Insights
    if (revenueData) {
      if (revenueData.friendCodeConversionRate > 30) {
        insights.push({
          id: `revenue-friendcode-${now.getTime()}`,
          type: "opportunity",
          priority: "medium",
          title: "High Friend Code Performance",
          summary: `Friend codes converting at ${revenueData.friendCodeConversionRate.toFixed(1)}%`,
          details: `${revenueData.friendCodesUsed} out of ${revenueData.friendCodesCreated} friend codes have been redeemed. This is above typical referral benchmarks - your community is actively sharing.`,
          metrics: {
            conversionRate: `${revenueData.friendCodeConversionRate.toFixed(1)}%`,
            codesCreated: revenueData.friendCodesCreated,
            codesUsed: revenueData.friendCodesUsed,
          },
          suggestedActions: [
            "Consider increasing friend codes per user",
            "Create referral rewards program",
            "Feature top referrers in community",
          ],
          generatedAt: now.toISOString(),
        });
      }

      if (revenueData.refundRate > 5) {
        insights.push({
          id: `revenue-refunds-${now.getTime()}`,
          type: "risk",
          priority: "high",
          title: "Elevated Refund Rate",
          summary: `Refund rate at ${revenueData.refundRate.toFixed(1)}% - above 5% threshold`,
          details: `${revenueData.refundCount} refunds processed out of ${revenueData.totalPurchases} purchases. This may indicate product-market fit issues or unclear expectations.`,
          metrics: {
            refundRate: `${revenueData.refundRate.toFixed(1)}%`,
            refundCount: revenueData.refundCount,
            totalPurchases: revenueData.totalPurchases,
          },
          suggestedActions: [
            "Survey recent refund requesters",
            "Review onboarding and first-day experience",
            "Clarify challenge expectations pre-purchase",
          ],
          generatedAt: now.toISOString(),
        });
      }
    }

    // Engagement Insights
    if (engagementData) {
      if (engagementData.completionRate > 70) {
        insights.push({
          id: `engagement-completion-${now.getTime()}`,
          type: "engagement",
          priority: "medium",
          title: "Excellent Completion Rate",
          summary: `${engagementData.completionRate.toFixed(1)}% of active users completing daily tasks`,
          details: `Users are highly engaged with ${engagementData.avgCompletionsPerUser.toFixed(1)} completions per active user. This indicates strong content-market fit.`,
          metrics: {
            completionRate: `${engagementData.completionRate.toFixed(1)}%`,
            avgCompletionsPerUser: engagementData.avgCompletionsPerUser.toFixed(1),
          },
          suggestedActions: [
            "Gather testimonials from engaged users",
            "Create case studies for marketing",
            "Consider premium upsell opportunities",
          ],
          generatedAt: now.toISOString(),
        });
      }

      if (engagementData.journalCompletionRate < 30) {
        insights.push({
          id: `engagement-journal-${now.getTime()}`,
          type: "risk",
          priority: "medium",
          title: "Low Journal Engagement",
          summary: `Only ${engagementData.journalCompletionRate.toFixed(1)}% of users writing journals`,
          details: `Journal entries are below target. Consider simplifying prompts or adding more guidance.`,
          metrics: {
            journalRate: `${engagementData.journalCompletionRate.toFixed(1)}%`,
          },
          suggestedActions: [
            "Review journal prompt complexity",
            "Add example entries for inspiration",
            "Consider voice-to-text option",
          ],
          generatedAt: now.toISOString(),
        });
      }
    }

    // Streak Insights
    if (streakData) {
      if (streakData.avgStreak > 10) {
        insights.push({
          id: `streak-positive-${now.getTime()}`,
          type: "engagement",
          priority: "low",
          title: "Strong Streak Performance",
          summary: `Average streak is ${streakData.avgStreak.toFixed(1)} days`,
          details: `Users are building consistent habits with ${streakData.usersWithStreaks} maintaining active streaks. Longest current streak: ${streakData.maxStreak} days.`,
          metrics: {
            avgStreak: streakData.avgStreak.toFixed(1),
            usersWithStreaks: streakData.usersWithStreaks,
            maxStreak: streakData.maxStreak,
          },
          suggestedActions: [
            "Celebrate milestone achievements publicly",
            "Add streak-based rewards",
          ],
          generatedAt: now.toISOString(),
        });
      }
    }

    // Churn Risk
    if (churnRiskData && churnRiskData.atRiskUsers > 10) {
      insights.push({
        id: `churn-risk-${now.getTime()}`,
        type: "risk",
        priority: "high",
        title: "Users at Churn Risk",
        summary: `${churnRiskData.atRiskUsers} users haven't engaged in 7+ days`,
        details: `These users had active streaks but haven't logged activity recently. Re-engagement campaign recommended.`,
        metrics: {
          atRiskUsers: churnRiskData.atRiskUsers,
          percentOfActive: `${churnRiskData.percentOfActive.toFixed(1)}%`,
        },
        suggestedActions: [
          "Send re-engagement email campaign",
          "Push notification with encouragement",
          "Offer streak forgiveness token",
        ],
        generatedAt: now.toISOString(),
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

// Analysis helper functions
async function analyzeUserGrowth(supabase: SupabaseClient) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", oneWeekAgo.toISOString()),
  ]);

  const newUsersThisWeek = thisWeek.count || 0;
  const newUsersLastWeek = lastWeek.count || 0;
  const weekOverWeekGrowth =
    newUsersLastWeek > 0 ? ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100 : 0;

  return { newUsersThisWeek, newUsersLastWeek, weekOverWeekGrowth };
}

async function analyzeRevenue(supabase: SupabaseClient) {
  const [purchases, refunds, friendCodes] = await Promise.all([
    supabase.from("purchases").select("id, status").eq("status", "completed"),
    supabase.from("purchases").select("id").eq("status", "refunded"),
    supabase.from("friend_codes").select("id, is_used"),
  ]);

  const totalPurchases = purchases.data?.length || 0;
  const refundCount = refunds.data?.length || 0;
  const refundRate = totalPurchases > 0 ? (refundCount / totalPurchases) * 100 : 0;

  const friendCodesCreated = friendCodes.data?.length || 0;
  const friendCodesUsed = friendCodes.data?.filter((c) => c.is_used).length || 0;
  const friendCodeConversionRate =
    friendCodesCreated > 0 ? (friendCodesUsed / friendCodesCreated) * 100 : 0;

  return {
    totalPurchases,
    refundCount,
    refundRate,
    friendCodesCreated,
    friendCodesUsed,
    friendCodeConversionRate,
  };
}

async function analyzeEngagement(supabase: SupabaseClient) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeUsers, completions, journals] = await Promise.all([
    supabase.from("user_stats").select("user_id").gt("current_streak", 0),
    supabase
      .from("challenge_progress")
      .select("user_id, completed_at")
      .not("completed_at", "is", null)
      .gte("completed_at", sevenDaysAgo),
    supabase.from("journal_entries").select("user_id").gte("created_at", sevenDaysAgo),
  ]);

  const activeUserCount = activeUsers.data?.length || 1;
  const completionCount = completions.data?.length || 0;
  const journalCount = journals.data?.length || 0;

  const completionRate = (completionCount / (activeUserCount * 7)) * 100;
  const avgCompletionsPerUser = completionCount / activeUserCount;
  const journalCompletionRate = (journalCount / activeUserCount) * 100;

  return {
    completionRate: Math.min(completionRate, 100),
    avgCompletionsPerUser,
    journalCompletionRate,
  };
}

async function analyzeStreaks(supabase: SupabaseClient) {
  const { data: streaks } = await supabase
    .from("user_stats")
    .select("current_streak")
    .gt("current_streak", 0);

  if (!streaks || streaks.length === 0) {
    return { avgStreak: 0, maxStreak: 0, usersWithStreaks: 0 };
  }

  const avgStreak = streaks.reduce((sum, s) => sum + s.current_streak, 0) / streaks.length;
  const maxStreak = Math.max(...streaks.map((s) => s.current_streak));

  return {
    avgStreak,
    maxStreak,
    usersWithStreaks: streaks.length,
  };
}

async function identifyChurnRisk(supabase: SupabaseClient) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalActive, inactive] = await Promise.all([
    supabase
      .from("user_stats")
      .select("user_id", { count: "exact", head: true })
      .gt("longest_streak", 0),
    supabase
      .from("user_stats")
      .select("user_id", { count: "exact", head: true })
      .gt("longest_streak", 3)
      .eq("current_streak", 0)
      .lt("last_active_at", sevenDaysAgo),
  ]);

  const totalActiveUsers = totalActive.count || 1;
  const atRiskUsers = inactive.count || 0;

  return {
    atRiskUsers,
    percentOfActive: (atRiskUsers / totalActiveUsers) * 100,
  };
}

// Generate a contextual insight based on current page
export function getContextualInsight(page: string, metrics: Record<string, number>): string | null {
  switch (page) {
    case "/admin":
      if (metrics.revenue && metrics.revenueYesterday) {
        const change =
          ((metrics.revenue - metrics.revenueYesterday) / metrics.revenueYesterday) * 100;
        if (Math.abs(change) > 20) {
          return change > 0
            ? `Revenue is up ${change.toFixed(0)}% today - nice momentum!`
            : `Revenue is down ${Math.abs(change).toFixed(0)}% today - worth investigating.`;
        }
      }
      break;
    case "/admin/users":
      if (metrics.newUsers > 50) {
        return `${metrics.newUsers} new users today - above average! Check acquisition sources.`;
      }
      break;
    case "/admin/community":
      if (metrics.pendingModeration > 5) {
        return `${metrics.pendingModeration} items awaiting review - consider prioritizing high-risk content.`;
      }
      break;
  }
  return null;
}
