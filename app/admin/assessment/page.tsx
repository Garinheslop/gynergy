"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import {
  AdminLayout,
  StatCard,
  ChartContainer,
  FunnelChartWidget,
  BarChartWidget,
} from "@modules/admin";

interface AssessmentAnalytics {
  funnel: {
    viewed: number;
    started: number;
    questionsCompleted: number;
    emailSubmitted: number;
    completed: number;
    ctaClicked: number;
    abandoned: number;
  };
  rates: {
    startRate: number;
    completionRate: number;
    emailCaptureRate: number;
    ctaRate: number;
    abandonmentRate: number;
  };
  averages: {
    completionTimeMinutes: number;
    scoreAverage: number;
    questionsBeforeAbandonment: number;
  };
  distribution: {
    scores: Array<{ name: string; value: number }>;
    lowestPillars: Array<{ name: string; value: number }>;
    twoAmThoughts: Array<{ name: string; value: number }>;
    readinessLevels: Array<{ name: string; value: number }>;
  };
  emailPerformance: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  recentCompletions: Array<{
    email: string;
    score: number;
    interpretation: string;
    completedAt: string;
    ctaClicked: boolean;
  }>;
}

const defaultAnalytics: AssessmentAnalytics = {
  funnel: {
    viewed: 0,
    started: 0,
    questionsCompleted: 0,
    emailSubmitted: 0,
    completed: 0,
    ctaClicked: 0,
    abandoned: 0,
  },
  rates: {
    startRate: 0,
    completionRate: 0,
    emailCaptureRate: 0,
    ctaRate: 0,
    abandonmentRate: 0,
  },
  averages: {
    completionTimeMinutes: 0,
    scoreAverage: 0,
    questionsBeforeAbandonment: 0,
  },
  distribution: {
    scores: [],
    lowestPillars: [],
    twoAmThoughts: [],
    readinessLevels: [],
  },
  emailPerformance: {
    sent: 0,
    opened: 0,
    clicked: 0,
    openRate: 0,
    clickRate: 0,
  },
  recentCompletions: [],
};

export default function AssessmentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AssessmentAnalytics>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/assessment-analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching assessment analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Convert funnel data for chart
  const funnelData = [
    { name: "Viewed", value: analytics.funnel.viewed, fill: "#6366f1" },
    { name: "Started", value: analytics.funnel.started, fill: "#8b5cf6" },
    { name: "Questions Done", value: analytics.funnel.questionsCompleted, fill: "#a855f7" },
    { name: "Email Captured", value: analytics.funnel.emailSubmitted, fill: "#d946ef" },
    { name: "Completed", value: analytics.funnel.completed, fill: "#b8943e" },
    { name: "CTA Clicked", value: analytics.funnel.ctaClicked, fill: "#22c55e" },
  ];

  return (
    <AdminLayout
      title="Assessment Funnel"
      description="Five Pillar Assessment conversion analytics"
    >
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
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatCard
          title="Start Rate"
          value={`${analytics.rates.startRate.toFixed(1)}%`}
          subtitle="Viewed → Started"
          trend={analytics.rates.startRate > 50 ? "up" : "down"}
          loading={isLoading}
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.rates.completionRate.toFixed(1)}%`}
          subtitle="Started → Completed"
          trend={analytics.rates.completionRate > 70 ? "up" : "down"}
          loading={isLoading}
        />
        <StatCard
          title="Email Capture"
          value={`${analytics.rates.emailCaptureRate.toFixed(1)}%`}
          subtitle="Questions → Email"
          trend={analytics.rates.emailCaptureRate > 80 ? "up" : "down"}
          loading={isLoading}
        />
        <StatCard
          title="CTA Click Rate"
          value={`${analytics.rates.ctaRate.toFixed(1)}%`}
          subtitle="Completed → Webinar"
          trend={analytics.rates.ctaRate > 30 ? "up" : "down"}
          loading={isLoading}
        />
        <StatCard
          title="Avg Score"
          value={analytics.averages.scoreAverage.toFixed(1)}
          subtitle="Out of 50"
          loading={isLoading}
        />
        <StatCard
          title="Avg Time"
          value={`${analytics.averages.completionTimeMinutes.toFixed(1)}m`}
          subtitle="To complete"
          loading={isLoading}
        />
      </div>

      {/* Funnel Chart */}
      <div className="mb-8">
        <ChartContainer title="Assessment Funnel" height={400}>
          <FunnelChartWidget data={funnelData} height={350} showPercentages loading={isLoading} />
        </ChartContainer>
      </div>

      {/* Two Column Layout */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* Score Distribution */}
        <ChartContainer title="Score Distribution" height={300}>
          <BarChartWidget
            data={[
              { name: "0-15", value: 0 },
              { name: "16-25", value: 0 },
              { name: "26-35", value: 0 },
              { name: "36-45", value: 0 },
              { name: "46-50", value: 0 },
              ...analytics.distribution.scores,
            ].slice(-5)}
            height={250}
            fill="#b8943e"
            loading={isLoading}
          />
        </ChartContainer>

        {/* Lowest Pillars */}
        <ChartContainer title="Lowest Pillar Distribution" height={300}>
          <BarChartWidget
            data={analytics.distribution.lowestPillars}
            height={250}
            fill="#dc3545"
            loading={isLoading}
          />
        </ChartContainer>
      </div>

      {/* Email Performance */}
      <div className="mb-8">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Email Report Performance</h3>
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

      {/* Recent Completions */}
      <div className="rounded-lg border border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white">Recent Completions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Interpretation</th>
                <th className="px-4 py-3">CTA Clicked</th>
                <th className="px-4 py-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : analytics.recentCompletions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No completions yet
                  </td>
                </tr>
              ) : (
                analytics.recentCompletions.map((completion, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 text-sm">
                    <td className="px-4 py-3 text-white">{completion.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-semibold",
                          completion.score >= 35
                            ? "text-green-400"
                            : completion.score >= 25
                              ? "text-yellow-400"
                              : "text-red-400"
                        )}
                      >
                        {completion.score}/50
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium",
                          completion.interpretation === "elite"
                            ? "bg-green-500/20 text-green-400"
                            : completion.interpretation === "gap"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {completion.interpretation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {completion.ctaClicked ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(completion.completedAt).toLocaleDateString()}
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
