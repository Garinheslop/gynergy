"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import {
  AdminLayout,
  StatCard,
  ChartContainer,
  AreaChartWidget,
  BarChartWidget,
} from "@modules/admin";
import type { ChartDataPoint } from "@modules/admin";

interface AnalyticsData {
  userGrowth: ChartDataPoint[];
  totalNewUsers: number;
  journalActivity: ChartDataPoint[];
  completionsActivity: ChartDataPoint[];
  dailyActiveUsers: ChartDataPoint[];
  engagement: {
    totalJournalEntries: number;
    avgWordCount: number;
    totalReflections: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalVideoViews: number;
    avgWatchTimeSeconds: number;
  };
  streakDistribution: ChartDataPoint[];
  levelDistribution: ChartDataPoint[];
  completionFunnel: ChartDataPoint[];
  topPosts: Array<{
    id: string;
    engagement: number;
    likes: number;
    comments: number;
  }>;
  summary: {
    avgDailyActiveUsers: number;
    avgDailyCompletions: number;
    avgDailyJournals: number;
  };
}

const defaultAnalytics: AnalyticsData = {
  userGrowth: [],
  totalNewUsers: 0,
  journalActivity: [],
  completionsActivity: [],
  dailyActiveUsers: [],
  engagement: {
    totalJournalEntries: 0,
    avgWordCount: 0,
    totalReflections: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalVideoViews: 0,
    avgWatchTimeSeconds: 0,
  },
  streakDistribution: [],
  levelDistribution: [],
  completionFunnel: [],
  topPosts: [],
  summary: {
    avgDailyActiveUsers: 0,
    avgDailyCompletions: 0,
    avgDailyJournals: 0,
  },
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <AdminLayout
      title="Platform Analytics"
      subtitle="Engagement, retention, and content performance"
    >
      {/* Date Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                dateRange === range
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="bg-grey-800 text-grey-400 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          <i className={`gng-refresh ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="New Users" value={analytics.totalNewUsers} icon="gng-users" />
        <StatCard
          title="Avg Daily Active Users"
          value={analytics.summary.avgDailyActiveUsers}
          icon="gng-activity"
        />
        <StatCard
          title="Avg Daily Completions"
          value={analytics.summary.avgDailyCompletions}
          icon="gng-check-circle"
        />
        <StatCard
          title="Avg Daily Journals"
          value={analytics.summary.avgDailyJournals}
          icon="gng-book"
        />
      </div>

      {/* Growth & Activity Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="User Growth"
          subtitle="New signups over time"
          actions={
            <span className="text-grey-500 text-sm">+{analytics.totalNewUsers} in period</span>
          }
        >
          {analytics.userGrowth.length > 0 ? (
            <AreaChartWidget data={analytics.userGrowth} xKey="name" yKey="value" color="#15b79e" />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Daily Active Users" subtitle="Unique users with activity">
          {analytics.dailyActiveUsers.length > 0 ? (
            <AreaChartWidget
              data={analytics.dailyActiveUsers}
              xKey="name"
              yKey="value"
              color="#8b5cf6"
            />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Engagement Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Challenge Completions" subtitle="Daily completions">
          {analytics.completionsActivity.length > 0 ? (
            <BarChartWidget
              data={analytics.completionsActivity}
              xKey="name"
              yKey="value"
              color="#ffc878"
            />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Journal Activity" subtitle="Entries per day">
          {analytics.journalActivity.length > 0 ? (
            <BarChartWidget
              data={analytics.journalActivity}
              xKey="name"
              yKey="value"
              color="#15b79e"
            />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Engagement Summary */}
      <div className="border-grey-800 bg-grey-900 mb-6 rounded-xl border p-5">
        <h3 className="mb-4 font-semibold text-white">Engagement Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-grey-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-action-900 text-action-400 flex h-10 w-10 items-center justify-center rounded-lg">
                <i className="gng-book text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {analytics.engagement.totalJournalEntries.toLocaleString()}
                </p>
                <p className="text-grey-400 text-sm">Journal Entries</p>
              </div>
            </div>
            <p className="text-grey-500 mt-2 text-xs">
              Avg {analytics.engagement.avgWordCount} words/entry
            </p>
          </div>

          <div className="bg-grey-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple/20 text-purple flex h-10 w-10 items-center justify-center rounded-lg">
                <i className="gng-heart text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {analytics.engagement.totalReflections.toLocaleString()}
                </p>
                <p className="text-grey-400 text-sm">Reflections</p>
              </div>
            </div>
          </div>

          <div className="bg-grey-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/20 text-warning flex h-10 w-10 items-center justify-center rounded-lg">
                <i className="gng-message-circle text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {analytics.engagement.totalPosts.toLocaleString()}
                </p>
                <p className="text-grey-400 text-sm">Community Posts</p>
              </div>
            </div>
            <p className="text-grey-500 mt-2 text-xs">
              {analytics.engagement.totalLikes} likes • {analytics.engagement.totalComments}{" "}
              comments
            </p>
          </div>

          <div className="bg-grey-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-error/20 text-error flex h-10 w-10 items-center justify-center rounded-lg">
                <i className="gng-play text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {analytics.engagement.totalVideoViews.toLocaleString()}
                </p>
                <p className="text-grey-400 text-sm">Video Views</p>
              </div>
            </div>
            <p className="text-grey-500 mt-2 text-xs">
              Avg watch time: {formatDuration(analytics.engagement.avgWatchTimeSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Distributions */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Streak Distribution */}
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
          <h3 className="mb-4 font-semibold text-white">Streak Distribution</h3>
          {analytics.streakDistribution.length > 0 ? (
            <div className="space-y-3">
              {analytics.streakDistribution.map((bucket) => {
                const total = analytics.streakDistribution.reduce((sum, b) => sum + b.value, 0);
                const percentage = total > 0 ? (bucket.value / total) * 100 : 0;
                return (
                  <div key={bucket.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-grey-400">{bucket.name}</span>
                      <span className="text-white">{bucket.value.toLocaleString()}</span>
                    </div>
                    <div className="bg-grey-800 h-2 overflow-hidden rounded-full">
                      <div
                        className="from-action-600 to-action-400 h-full rounded-full bg-gradient-to-r"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-grey-500 py-8 text-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>

        {/* Completion Funnel */}
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
          <h3 className="mb-4 font-semibold text-white">Completion Funnel</h3>
          {analytics.completionFunnel.length > 0 ? (
            <div className="space-y-3">
              {analytics.completionFunnel.map((step, index) => {
                const maxValue = analytics.completionFunnel[0]?.value || 1;
                const percentage = (step.value / maxValue) * 100;
                return (
                  <div key={step.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-grey-400">{step.name}+</span>
                      <span className="text-white">{step.value.toLocaleString()} users</span>
                    </div>
                    <div className="bg-grey-800 h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: `hsl(${170 - index * 20}, 70%, 50%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-grey-500 py-8 text-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>
      </div>

      {/* Level Distribution */}
      <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
        <h3 className="mb-4 font-semibold text-white">User Level Distribution</h3>
        {analytics.levelDistribution.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {analytics.levelDistribution.map((level) => (
              <div key={level.name} className="bg-grey-800 rounded-lg p-4 text-center">
                <div className="bg-purple/20 mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full">
                  <span className="text-purple text-lg font-bold">
                    {level.name.replace("Level ", "")}
                  </span>
                </div>
                <p className="text-xl font-bold text-white">{level.value.toLocaleString()}</p>
                <p className="text-grey-400 text-xs">{level.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-grey-500 py-8 text-center">
            {isLoading ? "Loading..." : "No data available"}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
