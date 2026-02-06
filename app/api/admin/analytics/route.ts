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
    const now = new Date();
    const rangeMs =
      range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : range === "90d"
          ? 90 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    const rangeStart = new Date(now.getTime() - rangeMs).toISOString();

    // Fetch all analytics data in parallel
    const [
      usersResult,
      journalEntriesResult,
      challengeProgressResult,
      reflectionsResult,
      postsResult,
      videoViewsResult,
      streaksResult,
      dailyLoginsResult,
    ] = await Promise.all([
      // User signups over time
      serviceClient
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", rangeStart)
        .order("created_at", { ascending: true }),

      // Journal entries over time
      serviceClient
        .from("journal_entries")
        .select("id, created_at, word_count")
        .gte("created_at", rangeStart),

      // Challenge progress completions
      serviceClient
        .from("challenge_progress")
        .select("id, completed_at, day_number")
        .not("completed_at", "is", null)
        .gte("completed_at", rangeStart),

      // Reflections submitted
      serviceClient.from("reflections").select("id, created_at").gte("created_at", rangeStart),

      // Community posts
      serviceClient
        .from("posts")
        .select("id, created_at, like_count, comment_count")
        .gte("created_at", rangeStart),

      // Video views
      serviceClient
        .from("video_watch_history")
        .select("id, watched_at, watch_duration_seconds")
        .gte("watched_at", rangeStart),

      // Current streaks for distribution
      serviceClient.from("user_stats").select("current_streak, total_points, level"),

      // Daily active users (approximated from challenge progress)
      serviceClient
        .from("challenge_progress")
        .select("user_id, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", rangeStart),
    ]);

    // Calculate user growth by day
    const userGrowth = aggregateByDay(usersResult.data || [], "created_at", range);

    // Calculate engagement metrics by day
    const journalActivity = aggregateByDay(journalEntriesResult.data || [], "created_at", range);

    const completionsActivity = aggregateByDay(
      challengeProgressResult.data || [],
      "completed_at",
      range
    );

    // Calculate DAU (unique users with activity per day)
    const dailyActiveUsers = calculateDAU(dailyLoginsResult.data || []);

    // Streak distribution
    const streakDistribution = calculateStreakDistribution(streaksResult.data || []);

    // Points distribution by level
    const levelDistribution = calculateLevelDistribution(streaksResult.data || []);

    // Content engagement
    const postsData = postsResult.data || [];
    const totalPosts = postsData.length;
    const totalLikes = postsData.reduce((sum, p) => sum + (p.like_count || 0), 0);
    const totalComments = postsData.reduce((sum, p) => sum + (p.comment_count || 0), 0);

    // Video engagement
    const videoData = videoViewsResult.data || [];
    const totalVideoViews = videoData.length;
    const totalWatchTime = videoData.reduce((sum, v) => sum + (v.watch_duration_seconds || 0), 0);
    const avgWatchTime = totalVideoViews > 0 ? Math.round(totalWatchTime / totalVideoViews) : 0;

    // Journal metrics
    const journalData = journalEntriesResult.data || [];
    const totalJournalEntries = journalData.length;
    const totalWords = journalData.reduce((sum, j) => sum + (j.word_count || 0), 0);
    const avgWordCount = totalJournalEntries > 0 ? Math.round(totalWords / totalJournalEntries) : 0;

    // Challenge progress
    const progressData = challengeProgressResult.data || [];
    const completionsByDay = new Map<number, number>();
    for (const p of progressData) {
      const day = p.day_number || 0;
      completionsByDay.set(day, (completionsByDay.get(day) || 0) + 1);
    }

    // Calculate completion funnel (days 1, 7, 14, 21, 30, 45)
    const funnelDays = [1, 7, 14, 21, 30, 45];
    const completionFunnel = funnelDays.map((day) => {
      const completed = Array.from(completionsByDay.entries())
        .filter(([d]) => d >= day)
        .reduce((sum, [, count]) => sum + count, 0);
      return { name: `Day ${day}`, value: completed };
    });

    // Top performing content
    const topPosts = [...postsData]
      .sort(
        (a, b) =>
          (b.like_count || 0) +
          (b.comment_count || 0) -
          (a.like_count || 0) -
          (a.comment_count || 0)
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        engagement: (p.like_count || 0) + (p.comment_count || 0),
        likes: p.like_count || 0,
        comments: p.comment_count || 0,
      }));

    const analytics = {
      // Growth
      userGrowth,
      totalNewUsers: usersResult.data?.length || 0,

      // Activity trends
      journalActivity,
      completionsActivity,
      dailyActiveUsers,

      // Engagement summary
      engagement: {
        totalJournalEntries,
        avgWordCount,
        totalReflections: reflectionsResult.data?.length || 0,
        totalPosts,
        totalLikes,
        totalComments,
        totalVideoViews,
        avgWatchTimeSeconds: avgWatchTime,
      },

      // Distributions
      streakDistribution,
      levelDistribution,
      completionFunnel,

      // Content performance
      topPosts,

      // Summary stats
      summary: {
        avgDailyActiveUsers:
          dailyActiveUsers.length > 0
            ? Math.round(
                dailyActiveUsers.reduce((sum, d) => sum + d.value, 0) / dailyActiveUsers.length
              )
            : 0,
        avgDailyCompletions:
          completionsActivity.length > 0
            ? Math.round(
                completionsActivity.reduce((sum, d) => sum + d.value, 0) /
                  completionsActivity.length
              )
            : 0,
        avgDailyJournals:
          journalActivity.length > 0
            ? Math.round(
                journalActivity.reduce((sum, d) => sum + d.value, 0) / journalActivity.length
              )
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      range,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// Aggregate data by day
function aggregateByDay(
  data: Array<{ [key: string]: unknown }>,
  dateField: string,
  _range: string
): Array<{ name: string; value: number }> {
  const groups = new Map<string, number>();

  for (const item of data) {
    const dateValue = item[dateField];
    if (!dateValue || typeof dateValue !== "string") continue;

    const date = new Date(dateValue);
    const key = date.toISOString().split("T")[0];
    groups.set(key, (groups.get(key) || 0) + 1);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      name: formatDateLabel(date),
      value: count,
    }));
}

// Calculate daily active users
function calculateDAU(
  data: Array<{ user_id?: string; completed_at?: string }>
): Array<{ name: string; value: number }> {
  const dailyUsers = new Map<string, Set<string>>();

  for (const item of data) {
    if (!item.completed_at || !item.user_id) continue;

    const date = new Date(item.completed_at).toISOString().split("T")[0];
    if (!dailyUsers.has(date)) {
      dailyUsers.set(date, new Set());
    }
    dailyUsers.get(date)!.add(item.user_id);
  }

  return Array.from(dailyUsers.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, users]) => ({
      name: formatDateLabel(date),
      value: users.size,
    }));
}

// Calculate streak distribution
function calculateStreakDistribution(
  data: Array<{ current_streak?: number }>
): Array<{ name: string; value: number }> {
  const buckets = {
    "0 days": 0,
    "1-7 days": 0,
    "8-14 days": 0,
    "15-30 days": 0,
    "30+ days": 0,
  };

  for (const item of data) {
    const streak = item.current_streak || 0;
    if (streak === 0) buckets["0 days"]++;
    else if (streak <= 7) buckets["1-7 days"]++;
    else if (streak <= 14) buckets["8-14 days"]++;
    else if (streak <= 30) buckets["15-30 days"]++;
    else buckets["30+ days"]++;
  }

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

// Calculate level distribution
function calculateLevelDistribution(
  data: Array<{ level?: number }>
): Array<{ name: string; value: number }> {
  const levels = new Map<number, number>();

  for (const item of data) {
    const level = item.level || 1;
    levels.set(level, (levels.get(level) || 0) + 1);
  }

  return Array.from(levels.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, count]) => ({
      name: `Level ${level}`,
      value: count,
    }));
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
