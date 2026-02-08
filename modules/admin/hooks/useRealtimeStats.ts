"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface RealtimeStats {
  activeUsersNow: number;
  todayRevenue: number;
  todaySignups: number;
  pendingModeration: number;
  systemHealth: "healthy" | "degraded" | "down";
  lastUpdated: string;
}

export interface UseRealtimeStatsOptions {
  pollInterval?: number; // ms, default 30000 (30s)
  enabled?: boolean;
}

const DEFAULT_STATS: RealtimeStats = {
  activeUsersNow: 0,
  todayRevenue: 0,
  todaySignups: 0,
  pendingModeration: 0,
  systemHealth: "healthy",
  lastUpdated: new Date().toISOString(),
};

export function useRealtimeStats(options: UseRealtimeStatsOptions = {}) {
  const { pollInterval = 30000, enabled = true } = options;

  const [stats, setStats] = useState<RealtimeStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Track previous values for animations
  const prevStats = useRef<RealtimeStats>(DEFAULT_STATS);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();

      if (data.success) {
        prevStats.current = stats;

        setStats({
          activeUsersNow: data.data.activeUsersNow || 0,
          todayRevenue: data.data.todayRevenue || 0,
          todaySignups: data.data.todaySignups || 0,
          pendingModeration: data.data.pendingModeration || 0,
          systemHealth: data.data.systemHealth || "healthy",
          lastUpdated: new Date().toISOString(),
        });

        setError(null);
        setIsStale(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  }, [stats]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchStats();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;

    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchStats]);

  // Mark as stale after 2x poll interval without update
  useEffect(() => {
    if (!enabled) return;

    const staleTimer = setTimeout(() => {
      setIsStale(true);
    }, pollInterval * 2);

    return () => clearTimeout(staleTimer);
  }, [stats.lastUpdated, pollInterval, enabled]);

  // Calculate changes from previous values
  const changes = {
    activeUsersNow: stats.activeUsersNow - prevStats.current.activeUsersNow,
    todayRevenue: stats.todayRevenue - prevStats.current.todayRevenue,
    todaySignups: stats.todaySignups - prevStats.current.todaySignups,
    pendingModeration: stats.pendingModeration - prevStats.current.pendingModeration,
  };

  return {
    stats,
    changes,
    isLoading,
    error,
    isStale,
    refresh: fetchStats,
  };
}

// Format helpers
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString();
}
