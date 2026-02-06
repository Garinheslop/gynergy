"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { ChartDataPoint } from "../../types/admin";

interface AreaChartWidgetProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  secondaryKey?: string;
  color?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  formatTooltip?: (value: number) => string;
  formatYAxis?: (value: number) => string;
}

export default function AreaChartWidget({
  data,
  xKey,
  yKey,
  secondaryKey,
  color = "#15b79e",
  secondaryColor = "#a86cff",
  showGrid = true,
  formatTooltip,
  formatYAxis,
}: AreaChartWidgetProps) {
  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {secondaryKey && (
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />}
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 12 }}
          tickFormatter={formatYAxis || defaultFormatter}
          dx={-10}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          labelStyle={{ color: "#9CA3AF" }}
          itemStyle={{ color: "#F9FAFB" }}
          formatter={(value: number | undefined) => {
            const numValue = value ?? 0;
            return [formatTooltip ? formatTooltip(numValue) : defaultFormatter(numValue), yKey];
          }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPrimary)"
        />
        {secondaryKey && (
          <Area
            type="monotone"
            dataKey={secondaryKey}
            stroke={secondaryColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSecondary)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
