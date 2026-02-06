"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import type { ChartDataPoint } from "../../types/admin";

interface BarChartWidgetProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  secondaryKey?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  horizontal?: boolean;
  formatTooltip?: (value: number) => string;
  formatYAxis?: (value: number) => string;
  colorByValue?: boolean;
}

export default function BarChartWidget({
  data,
  xKey,
  yKey,
  color = "#15b79e",
  secondaryKey,
  secondaryColor = "#a86cff",
  showGrid = true,
  horizontal = false,
  formatTooltip,
  formatYAxis,
  colorByValue = false,
}: BarChartWidgetProps) {
  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  const getBarColor = (value: number, _index: number) => {
    if (!colorByValue) return color;
    // Color gradient based on value
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#15b79e"];
    const max = Math.max(...data.map((d) => d[yKey] as number));
    const ratio = value / max;
    return colors[Math.min(Math.floor(ratio * colors.length), colors.length - 1)];
  };

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />}
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickFormatter={formatYAxis || defaultFormatter}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            itemStyle={{ color: "#F9FAFB" }}
            formatter={(value: number | undefined) => {
              const numValue = value ?? 0;
              return [formatTooltip ? formatTooltip(numValue) : defaultFormatter(numValue), yKey];
            }}
          />
          <Bar dataKey={yKey} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry[yKey] as number, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          }}
          labelStyle={{ color: "#9CA3AF" }}
          itemStyle={{ color: "#F9FAFB" }}
          formatter={(value: number | undefined) => {
            const numValue = value ?? 0;
            return [formatTooltip ? formatTooltip(numValue) : defaultFormatter(numValue), yKey];
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        {secondaryKey && <Bar dataKey={secondaryKey} fill={secondaryColor} radius={[4, 4, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  );
}
