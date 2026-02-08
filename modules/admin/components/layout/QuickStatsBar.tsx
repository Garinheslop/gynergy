"use client";

import { cn } from "@lib/utils/style";

import {
  useRealtimeStats,
  formatCurrency,
  formatNumber,
  formatTimeAgo,
} from "../../hooks/useRealtimeStats";

interface QuickStatsBarProps {
  className?: string;
}

export default function QuickStatsBar({ className }: QuickStatsBarProps) {
  const { stats, changes, isLoading, isStale, refresh } = useRealtimeStats({
    pollInterval: 30000, // 30 seconds
  });

  const statItems = [
    {
      label: "Active Now",
      value: formatNumber(stats.activeUsersNow),
      change: changes.activeUsersNow,
      icon: "gng-users",
      color: "text-action-400",
    },
    {
      label: "Today Revenue",
      value: formatCurrency(stats.todayRevenue),
      change: changes.todayRevenue,
      icon: "gng-dollar",
      color: "text-action-400",
      formatChange: (v: number) => formatCurrency(v),
    },
    {
      label: "New Signups",
      value: stats.todaySignups.toString(),
      change: changes.todaySignups,
      icon: "gng-user-plus",
      color: "text-purple",
    },
    {
      label: "Moderation",
      value: stats.pendingModeration.toString(),
      change: changes.pendingModeration,
      icon: "gng-shield",
      color: stats.pendingModeration > 5 ? "text-warning" : "text-grey-400",
      hideChange: true,
    },
  ];

  return (
    <div
      className={cn(
        "border-grey-800 bg-grey-900/80 hidden items-center gap-6 rounded-lg border px-4 py-2 backdrop-blur-sm lg:flex",
        className
      )}
    >
      {statItems.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {index > 0 && <div className="bg-grey-700 h-4 w-px" />}

          <i className={cn(item.icon, "text-sm", item.color)} />

          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-sm font-semibold", item.color)}>
              {isLoading ? "—" : item.value}
            </span>
            <span className="text-grey-500 text-xs">{item.label}</span>

            {/* Change indicator */}
            {!item.hideChange && item.change !== 0 && !isLoading && (
              <span
                className={cn(
                  "text-xs font-medium",
                  item.change > 0 ? "text-action-400" : "text-error"
                )}
              >
                {item.change > 0 ? "+" : ""}
                {item.formatChange ? item.formatChange(item.change) : item.change}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className="bg-grey-700 h-4 w-px" />

        <button
          onClick={refresh}
          className="text-grey-500 hover:text-grey-300 flex items-center gap-1.5 text-xs transition-colors"
          title={`Last updated: ${formatTimeAgo(stats.lastUpdated)}`}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isStale
                ? "bg-warning animate-pulse"
                : stats.systemHealth === "healthy"
                  ? "bg-action-400"
                  : stats.systemHealth === "degraded"
                    ? "bg-warning"
                    : "bg-error"
            )}
          />
          <span className="hidden xl:inline">
            {isStale ? "Stale" : formatTimeAgo(stats.lastUpdated)}
          </span>
          <i className="gng-refresh-cw text-[10px]" />
        </button>
      </div>
    </div>
  );
}
