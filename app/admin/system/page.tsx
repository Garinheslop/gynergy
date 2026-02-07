"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import {
  AdminLayout,
  StatCard,
  ChartContainer,
  LineChartWidget,
  AreaChartWidget,
  AuditLogViewer,
} from "@modules/admin";
import type { ChartDataPoint } from "@modules/admin";

interface ServiceStatus {
  database: "healthy" | "degraded" | "down";
  api: "healthy" | "degraded" | "down";
  auth: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
}

interface SystemData {
  health: {
    overall: "healthy" | "degraded" | "down";
    services: ServiceStatus;
    criticalIssues: string[];
    lastChecked: string;
  };
  stats: {
    totalUsers: number;
    newUsersToday: number;
    purchasesToday: number;
    activeUsersNow: number;
  };
  metrics: Record<string, Array<{ name: string; value: number; recorded_at: string }>>;
  uptime: {
    api: string;
    database: string;
    lastRestart: string;
  };
  performance?: {
    apiLatency: ChartDataPoint[];
    errorRate: ChartDataPoint[];
    requestVolume: ChartDataPoint[];
  };
}

const defaultData: SystemData = {
  health: {
    overall: "healthy",
    services: {
      database: "healthy",
      api: "healthy",
      auth: "healthy",
      storage: "healthy",
    },
    criticalIssues: [],
    lastChecked: new Date().toISOString(),
  },
  stats: {
    totalUsers: 0,
    newUsersToday: 0,
    purchasesToday: 0,
    activeUsersNow: 0,
  },
  metrics: {},
  uptime: {
    api: "N/A",
    database: "N/A",
    lastRestart: "N/A",
  },
  performance: {
    apiLatency: [],
    errorRate: [],
    requestVolume: [],
  },
};

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "logs">("overview");

  const fetchSystemData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching system data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-action-400";
      case "degraded":
        return "bg-warning";
      case "down":
        return "bg-error";
      default:
        return "bg-grey-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-action-900 text-action-400";
      case "degraded":
        return "bg-warning/20 text-warning";
      case "down":
        return "bg-error/20 text-error";
      default:
        return "bg-grey-700 text-grey-400";
    }
  };

  return (
    <AdminLayout title="System Health" subtitle="Infrastructure monitoring and audit logs">
      {/* Overall Health Banner */}
      <div
        className={cn(
          "mb-6 rounded-xl p-4",
          data.health.overall === "healthy"
            ? "bg-action-900 border-action-800 border"
            : data.health.overall === "degraded"
              ? "bg-warning/10 border-warning/50 border"
              : "bg-error/10 border-error/50 border"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                data.health.overall === "healthy"
                  ? "bg-action-600"
                  : data.health.overall === "degraded"
                    ? "bg-warning"
                    : "bg-error"
              )}
            >
              <i
                className={cn(
                  "text-xl text-white",
                  data.health.overall === "healthy"
                    ? "gng-check"
                    : data.health.overall === "degraded"
                      ? "gng-alert-triangle"
                      : "gng-x"
                )}
              />
            </div>
            <div>
              <h2
                className={cn(
                  "text-lg font-semibold",
                  data.health.overall === "healthy"
                    ? "text-action-400"
                    : data.health.overall === "degraded"
                      ? "text-warning"
                      : "text-error"
                )}
              >
                System{" "}
                {data.health.overall === "healthy"
                  ? "Healthy"
                  : data.health.overall === "degraded"
                    ? "Degraded"
                    : "Down"}
              </h2>
              <p className="text-grey-400 text-sm">
                Last checked: {new Date(data.health.lastChecked).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={fetchSystemData}
            disabled={isLoading}
            className="bg-grey-800 text-grey-400 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            <i className={`gng-refresh ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Critical Issues */}
        {data.health.criticalIssues.length > 0 && (
          <div className="bg-grey-900/50 mt-4 rounded-lg p-3">
            <h4 className="text-error mb-2 text-sm font-medium">Critical Issues:</h4>
            <ul className="space-y-1">
              {data.health.criticalIssues.map((issue, i) => (
                <li key={i} className="text-grey-300 flex items-center gap-2 text-sm">
                  <i className="gng-alert-circle text-error" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-grey-800 mb-6 flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "overview"
              ? "border-action-500 text-white"
              : "text-grey-400 hover:text-grey-300 border-transparent"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "performance"
              ? "border-action-500 text-white"
              : "text-grey-400 hover:text-grey-300 border-transparent"
          )}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "logs"
              ? "border-action-500 text-white"
              : "text-grey-400 hover:text-grey-300 border-transparent"
          )}
        >
          Audit Logs
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Service Status */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.health.services).map(([service, status]) => (
              <div key={service} className="border-grey-800 bg-grey-900 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full", getStatusColor(status))} />
                    <span className="font-medium text-white capitalize">{service}</span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      getStatusBgColor(status)
                    )}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={data.stats.totalUsers} icon="gng-users" />
            <StatCard
              title="New Users Today"
              value={data.stats.newUsersToday}
              icon="gng-user-plus"
            />
            <StatCard title="Purchases Today" value={data.stats.purchasesToday} icon="gng-dollar" />
            <StatCard title="Active Now" value={data.stats.activeUsersNow} icon="gng-activity" />
          </div>

          {/* Uptime */}
          <div className="border-grey-800 bg-grey-900 mb-6 rounded-xl border p-5">
            <h3 className="mb-4 font-semibold text-white">Uptime</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-grey-800 rounded-lg p-4 text-center">
                <p className="text-action-400 text-2xl font-bold">{data.uptime.api}</p>
                <p className="text-grey-400 text-sm">API Uptime</p>
              </div>
              <div className="bg-grey-800 rounded-lg p-4 text-center">
                <p className="text-action-400 text-2xl font-bold">{data.uptime.database}</p>
                <p className="text-grey-400 text-sm">Database Uptime</p>
              </div>
              <div className="bg-grey-800 rounded-lg p-4 text-center">
                <p className="text-grey-300 text-lg font-medium">{data.uptime.lastRestart}</p>
                <p className="text-grey-400 text-sm">Last Restart</p>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          {Object.keys(data.metrics).length > 0 && (
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
              <h3 className="mb-4 font-semibold text-white">System Metrics</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.metrics).map(([category, metrics]) => (
                  <div key={category} className="bg-grey-800 rounded-lg p-4">
                    <h4 className="text-grey-400 mb-3 text-sm font-medium capitalize">
                      {category.replace("_", " ")}
                    </h4>
                    <div className="space-y-2">
                      {metrics.slice(0, 5).map((metric, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-grey-300">{metric.name}</span>
                          <span className="font-medium text-white">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <>
          {/* Performance Metrics Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-grey-400 text-sm">Avg Response Time</span>
                <span className="text-action-400 text-xs">Last 1h</span>
              </div>
              <p className="text-action-400 mt-2 text-2xl font-bold">
                {data.performance?.apiLatency.length
                  ? `${Math.round(data.performance.apiLatency.reduce((a, b) => a + b.value, 0) / data.performance.apiLatency.length)}ms`
                  : "—"}
              </p>
            </div>
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-grey-400 text-sm">Error Rate</span>
                <span className="text-action-400 text-xs">Last 1h</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {data.performance?.errorRate.length
                  ? `${(data.performance.errorRate.reduce((a, b) => a + b.value, 0) / data.performance.errorRate.length).toFixed(2)}%`
                  : "—"}
              </p>
            </div>
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-grey-400 text-sm">Total Requests</span>
                <span className="text-action-400 text-xs">Last 1h</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {data.performance?.requestVolume.length
                  ? data.performance.requestVolume.reduce((a, b) => a + b.value, 0).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-grey-400 text-sm">Success Rate</span>
                <span className="text-action-400 text-xs">Last 1h</span>
              </div>
              <p className="text-action-400 mt-2 text-2xl font-bold">
                {data.performance?.errorRate.length
                  ? `${(100 - data.performance.errorRate.reduce((a, b) => a + b.value, 0) / data.performance.errorRate.length).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <ChartContainer title="API Response Time" subtitle="Average latency (ms)">
              {data.performance?.apiLatency && data.performance.apiLatency.length > 0 ? (
                <LineChartWidget
                  data={data.performance.apiLatency}
                  xKey="name"
                  lines={[{ dataKey: "value", name: "Latency", color: "#15b79e", strokeWidth: 2 }]}
                  referenceLines={[{ y: 200, label: "Target", color: "#fbbf24" }]}
                />
              ) : (
                <div className="text-grey-500 flex h-full items-center justify-center">
                  No latency data available
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Request Volume" subtitle="Requests per minute">
              {data.performance?.requestVolume && data.performance.requestVolume.length > 0 ? (
                <AreaChartWidget
                  data={data.performance.requestVolume}
                  xKey="name"
                  yKey="value"
                  color="#a86cff"
                />
              ) : (
                <div className="text-grey-500 flex h-full items-center justify-center">
                  No request data available
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Error Rate Chart */}
          <ChartContainer title="Error Rate" subtitle="Percentage of failed requests">
            {data.performance?.errorRate && data.performance.errorRate.length > 0 ? (
              <LineChartWidget
                data={data.performance.errorRate}
                xKey="name"
                lines={[{ dataKey: "value", name: "Error %", color: "#ef4444", strokeWidth: 2 }]}
                referenceLines={[{ y: 1, label: "Threshold", color: "#fbbf24" }]}
                formatYAxis={(v) => `${v}%`}
              />
            ) : (
              <div className="text-grey-500 flex h-full items-center justify-center">
                No error data available
              </div>
            )}
          </ChartContainer>
        </>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "logs" && <AuditLogViewer showFilters maxHeight="calc(100vh - 320px)" />}
    </AdminLayout>
  );
}
