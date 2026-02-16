"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import {
  AdminLayout,
  StatCard,
  ChartContainer,
  FunnelChartWidget,
  BarChartWidget,
  LineChartWidget,
} from "@modules/admin";

interface WebinarAnalytics {
  overview: {
    totalRegistrations: number;
    totalAttended: number;
    totalWatchedReplay: number;
    attendanceRate: number;
    noShowRate: number;
    avgQuestionsPerAttendee: number;
    avgChatMessagesPerAttendee: number;
  };
  funnel: Array<{ name: string; value: number; fill: string }>;
  sources: Array<{ name: string; value: number }>;
  trend: Array<{ date: string; registrations: number }>;
  emailPerformance: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  engagement: {
    totalQuestions: number;
    totalChatMessages: number;
    questionsPerAttendee: string;
    chatMessagesPerAttendee: string;
  };
  recentRegistrations: Array<{
    email: string;
    firstName: string;
    source: string;
    registeredAt: string;
    attended: boolean;
  }>;
}

const defaultAnalytics: WebinarAnalytics = {
  overview: {
    totalRegistrations: 0,
    totalAttended: 0,
    totalWatchedReplay: 0,
    attendanceRate: 0,
    noShowRate: 0,
    avgQuestionsPerAttendee: 0,
    avgChatMessagesPerAttendee: 0,
  },
  funnel: [],
  sources: [],
  trend: [],
  emailPerformance: {
    sent: 0,
    opened: 0,
    clicked: 0,
    openRate: 0,
    clickRate: 0,
  },
  engagement: {
    totalQuestions: 0,
    totalChatMessages: 0,
    questionsPerAttendee: "0",
    chatMessagesPerAttendee: "0",
  },
  recentRegistrations: [],
};

export default function WebinarAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WebinarAnalytics>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/webinar-analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching webinar analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Add default data for charts
  const sourceData =
    analytics.sources.length > 0
      ? analytics.sources
      : [
          { name: "Landing Page", value: 0 },
          { name: "Assessment", value: 0 },
          { name: "Direct", value: 0 },
        ];

  const trendData =
    analytics.trend.length > 0
      ? analytics.trend
      : [{ date: new Date().toISOString().split("T")[0], registrations: 0 }];

  return (
    <AdminLayout title="Webinar Analytics" subtitle="Registration and attendance tracking">
      {/* Date Range Selector */}
      <div className="mb-6 flex justify-end">
        <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "rounded px-4 py-2 text-sm font-medium transition-colors",
                dateRange === range ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Registrations" value={analytics.overview.totalRegistrations.toString()} />
        <StatCard title="Attended Live" value={analytics.overview.totalAttended.toString()} />
        <StatCard
          title="Attendance Rate"
          value={`${analytics.overview.attendanceRate.toFixed(1)}%`}
          change={{
            value: analytics.overview.attendanceRate,
            period: "30d",
            isPositive: analytics.overview.attendanceRate > 40,
          }}
        />
        <StatCard
          title="No-Show Rate"
          value={`${analytics.overview.noShowRate.toFixed(1)}%`}
          change={{
            value: analytics.overview.noShowRate,
            period: "30d",
            isPositive: analytics.overview.noShowRate < 50,
          }}
        />
        <StatCard title="Watched Replay" value={analytics.overview.totalWatchedReplay.toString()} />
        <StatCard title="Avg Questions" value={analytics.engagement.questionsPerAttendee} />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-8 flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {/* Charts */}
      {!isLoading && (
        <>
          {/* Funnel Chart */}
          <div className="mb-8">
            <ChartContainer title="Registration Funnel" height={400}>
              <FunnelChartWidget data={analytics.funnel} showPercentage />
            </ChartContainer>
          </div>

          {/* Two Column Layout */}
          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            {/* Registration Sources */}
            <ChartContainer title="Registration Sources" height={300}>
              <BarChartWidget data={sourceData} xKey="name" yKey="value" color="#8b5cf6" />
            </ChartContainer>

            {/* Registration Trend */}
            <ChartContainer title="Daily Registrations" height={300}>
              <LineChartWidget
                data={trendData.map((d) => ({ ...d, name: d.date, value: d.registrations }))}
                xKey="date"
                lines={[{ dataKey: "registrations", name: "Registrations", color: "#22c55e" }]}
                showLegend={false}
              />
            </ChartContainer>
          </div>
        </>
      )}

      {/* Email Performance */}
      <div className="mb-8">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Email Performance</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{analytics.emailPerformance.sent}</p>
              <p className="text-sm text-gray-400">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">
                {analytics.emailPerformance.opened}
              </p>
              <p className="text-sm text-gray-400">Opened</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-400">
                {analytics.emailPerformance.clicked}
              </p>
              <p className="text-sm text-gray-400">Clicked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {analytics.emailPerformance.openRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Open Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">
                {analytics.emailPerformance.clickRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Click Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="mb-8">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Live Engagement</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{analytics.engagement.totalQuestions}</p>
              <p className="text-sm text-gray-400">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {analytics.engagement.totalChatMessages}
              </p>
              <p className="text-sm text-gray-400">Chat Messages</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">
                {analytics.engagement.questionsPerAttendee}
              </p>
              <p className="text-sm text-gray-400">Qs / Attendee</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-400">
                {analytics.engagement.chatMessagesPerAttendee}
              </p>
              <p className="text-sm text-gray-400">Msgs / Attendee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="rounded-lg border border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white">Recent Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Attended</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : analytics.recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No registrations yet
                  </td>
                </tr>
              ) : (
                analytics.recentRegistrations.map((reg, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 text-sm">
                    <td className="px-4 py-3 text-white">{reg.email}</td>
                    <td className="px-4 py-3 text-gray-300">{reg.firstName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                        {reg.source.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {reg.attended ? (
                        <span className="text-green-400">✓ Yes</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
