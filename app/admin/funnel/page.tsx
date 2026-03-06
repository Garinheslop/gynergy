"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@lib/utils/style";
import {
  AdminLayout,
  StatCard,
  ChartContainer,
  BarChartWidget,
  FunnelChartWidget,
} from "@modules/admin";

interface FunnelStats {
  funnel: {
    assessments: number;
    webinarRegistrations: number;
    purchases: number;
    conversionRates: {
      assessmentToWebinar: number;
      webinarToPurchase: number;
      assessmentToPurchase: number;
    };
  };
  email: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    campaignData: Array<{
      name: string;
      sent: number;
      opened: number;
      clicked: number;
      openRate: number;
      clickRate: number;
    }>;
  };
  drip: {
    activeEnrollments: number;
  };
  revenue: {
    estimated: number;
    purchases: number;
  };
  range: string;
}

type DateRange = "7d" | "30d" | "90d";

export default function FunnelDashboardPage() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/funnel-stats?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
          setLastUpdated(new Date());
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    setIsLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // 5min refresh
    return () => clearInterval(interval);
  }, [fetchStats]);

  const funnelData = stats
    ? [
        { name: "Assessments", value: stats.funnel.assessments },
        { name: "Webinar Registrations", value: stats.funnel.webinarRegistrations },
        { name: "Purchases", value: stats.funnel.purchases },
      ]
    : [];

  return (
    <AdminLayout
      title="Marketing Funnel"
      subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
    >
      {/* Date Range Selector */}
      <div className="mb-6 flex items-center gap-2">
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

      {isLoading ? (
        <div className="text-grey-500 flex h-64 items-center justify-center">Loading...</div>
      ) : stats ? (
        <>
          {/* Top-line Stats */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Assessments" value={stats.funnel.assessments} icon="gng-clipboard" />
            <StatCard
              title="Webinar Registrations"
              value={stats.funnel.webinarRegistrations}
              icon="gng-video"
            />
            <StatCard title="Purchases" value={stats.funnel.purchases} icon="gng-credit-card" />
            <StatCard
              title="Revenue"
              value={stats.revenue.estimated}
              format="currency"
              icon="gng-dollar"
            />
          </div>

          {/* Conversion Rates */}
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Assessment → Webinar"
              value={stats.funnel.conversionRates.assessmentToWebinar}
              format="percentage"
            />
            <StatCard
              title="Webinar → Purchase"
              value={stats.funnel.conversionRates.webinarToPurchase}
              format="percentage"
            />
            <StatCard
              title="Assessment → Purchase"
              value={stats.funnel.conversionRates.assessmentToPurchase}
              format="percentage"
            />
          </div>

          {/* Funnel Chart + Email Stats */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <ChartContainer title="Conversion Funnel" subtitle={`Last ${dateRange}`}>
              {funnelData.length > 0 && funnelData[0].value > 0 ? (
                <FunnelChartWidget data={funnelData} showPercentage />
              ) : (
                <div className="text-grey-500 flex h-full items-center justify-center">
                  No funnel data available
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Email Performance" subtitle="Open rates by campaign">
              {stats.email.campaignData.length > 0 ? (
                <BarChartWidget
                  data={stats.email.campaignData.map((c) => ({
                    name: c.name,
                    value: c.openRate,
                  }))}
                  xKey="name"
                  yKey="value"
                  color="#15b79e"
                />
              ) : (
                <div className="text-grey-500 flex h-full items-center justify-center">
                  No email data available
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Email Overview */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Emails Sent" value={stats.email.totalSent} icon="gng-mail" />
            <StatCard
              title="Open Rate"
              value={stats.email.openRate}
              format="percentage"
              icon="gng-eye"
            />
            <StatCard
              title="Click Rate"
              value={stats.email.clickRate}
              format="percentage"
              icon="gng-cursor"
            />
            <StatCard
              title="Active Drip Enrollments"
              value={stats.drip.activeEnrollments}
              icon="gng-mail"
            />
          </div>
        </>
      ) : (
        <div className="text-grey-500 flex h-64 items-center justify-center">
          Failed to load funnel data
        </div>
      )}
    </AdminLayout>
  );
}
