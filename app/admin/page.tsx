"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import {
  AdminLayout,
  StatCard,
  ChartContainer,
  AreaChartWidget,
  BarChartWidget,
  RecentActivityWidget,
  AlertsWidget,
} from "@modules/admin";
import type { DashboardMetrics, ChartDataPoint } from "@modules/admin";

// Default metrics for initial render
const defaultMetrics: DashboardMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newUsersWeek: 0,
  totalRevenue: 0,
  revenueMonth: 0,
  challengeCompletionRate: 0,
  averageStreak: 0,
  pendingModeration: 0,
  systemHealth: "healthy",
};

interface Activity {
  id: string;
  type: "user_signup" | "purchase" | "completion" | "moderation" | "system";
  title: string;
  description: string;
  timestamp: string;
}

interface Alert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
}

type DateRange = "7d" | "30d" | "90d";

const isValidDateRange = (value: string | null): value is DateRange => {
  return value === "7d" || value === "30d" || value === "90d";
};

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read date range from URL params with fallback to "30d"
  const urlRange = searchParams.get("range");
  const dateRange: DateRange = isValidDateRange(urlRange) ? urlRange : "30d";

  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update URL when date range changes
  const setDateRange = useCallback((range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [statsRes, activityRes, alertsRes, trendsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
        fetch("/api/admin/alerts"),
        fetch(`/api/admin/trends?range=${dateRange}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setMetrics(statsData.data);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) setActivities(activityData.data);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        if (alertsData.success) setAlerts(alertsData.data);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        if (trendsData.success) {
          setUserGrowthData(trendsData.data.userGrowth || []);
          setRevenueData(trendsData.data.revenueTrend || []);
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const getSparkline = (data: ChartDataPoint[], count = 7) => {
    if (data.length === 0) return undefined;
    return data.slice(-count).map((d) => d.value);
  };

  return (
    <AdminLayout title="Dashboard" subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}>
      {/* Date Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                dateRange === range
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="bg-grey-800 text-grey-400 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          <i className={`gng-refresh ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={metrics.totalUsers}
          icon="gng-users"
          sparklineData={getSparkline(userGrowthData)}
        />
        <StatCard
          title="Monthly Revenue"
          value={metrics.revenueMonth}
          format="currency"
          icon="gng-dollar"
          sparklineData={getSparkline(revenueData)}
        />
        <StatCard title="MRR" value={metrics.mrr || 0} format="currency" icon="gng-trending-up" />
        <StatCard title="Active Users" value={metrics.activeUsers} icon="gng-activity" />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completion Rate"
          value={metrics.challengeCompletionRate}
          format="percentage"
          icon="gng-check-circle"
        />
        <StatCard title="Avg. Streak" value={`${metrics.averageStreak} days`} icon="gng-fire" />
        <StatCard
          title="Friend Code Conv."
          value={metrics.friendCodeConversionRate || 0}
          format="percentage"
          icon="gng-share"
        />
        <StatCard title="Pending Review" value={metrics.pendingModeration} icon="gng-flag" />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="User Growth"
          subtitle={`New signups (${dateRange})`}
          actions={<span className="text-grey-500 text-sm">+{metrics.newUsersWeek} this week</span>}
        >
          {userGrowthData.length > 0 ? (
            <AreaChartWidget data={userGrowthData} xKey="name" yKey="value" color="#15b79e" />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title="Revenue"
          subtitle={`${dateRange === "90d" ? "Weekly" : "Daily"} breakdown`}
          actions={
            <span className="text-grey-500 text-sm">
              {formatCurrency(metrics.revenueMonth)} this month
            </span>
          }
        >
          {revenueData.length > 0 ? (
            <BarChartWidget
              data={revenueData}
              xKey="name"
              yKey="value"
              color="#ffc878"
              formatTooltip={formatCurrency}
            />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Sales Breakdown */}
      <div className="border-grey-800 bg-grey-900 mb-6 rounded-xl border p-5">
        <h3 className="mb-4 font-semibold text-white">Sales Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-grey-800 rounded-lg p-4">
            <p className="text-grey-400 text-sm">Challenge Purchases</p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.challengePurchases || 0}</p>
          </div>
          <div className="bg-grey-800 rounded-lg p-4">
            <p className="text-grey-400 text-sm">Friend Code Redemptions</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {metrics.friendCodeRedemptions || 0}
            </p>
          </div>
          <div className="bg-grey-800 rounded-lg p-4">
            <p className="text-grey-400 text-sm">Active Subscriptions</p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.activeSubscriptions || 0}</p>
          </div>
          <div className="bg-grey-800 rounded-lg p-4">
            <p className="text-grey-400 text-sm">Total Refunds</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(metrics.refundsTotal || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row - Activity and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityWidget activities={activities} isLoading={isLoading} />
        <AlertsWidget alerts={alerts} isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
}
