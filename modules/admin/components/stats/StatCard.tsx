"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

import { cn } from "@lib/utils/style";

import type { StatCardData } from "../../types/admin";

interface StatCardProps extends StatCardData {
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  sparklineData,
  format = "number",
  className,
}: StatCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  };

  const sparklineChartData = sparklineData?.map((value, index) => ({
    index,
    value,
  }));

  return (
    <div
      className={cn(
        "border-grey-800 bg-grey-900 relative overflow-hidden rounded-xl border p-5",
        className
      )}
    >
      {/* Sparkline Background */}
      {sparklineChartData && sparklineChartData.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-16 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineChartData}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={change?.isPositive ? "#15b79e" : "#fd6a6a"}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={change?.isPositive ? "#15b79e" : "#fd6a6a"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={change?.isPositive ? "#15b79e" : "#fd6a6a"}
                strokeWidth={1.5}
                fill={`url(#gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-grey-400 text-sm font-medium">{title}</span>
          {icon && (
            <div className="bg-grey-800 flex h-8 w-8 items-center justify-center rounded-lg">
              <i className={cn(icon, "text-grey-400")} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mt-3">
          <span className="text-3xl font-bold text-white">{formatValue(value)}</span>
        </div>

        {/* Change Indicator */}
        {change && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                change.isPositive ? "bg-action-900 text-action-400" : "bg-danger/20 text-danger"
              )}
            >
              <i
                className={cn("text-[10px]", change.isPositive ? "gng-arrow-up" : "gng-arrow-down")}
              />
              {Math.abs(change.value).toFixed(1)}%
            </span>
            <span className="text-grey-500 text-xs">vs last {change.period}</span>
          </div>
        )}
      </div>
    </div>
  );
}
