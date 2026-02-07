"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import type { ChartDataPoint } from "../../types/admin";

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean;
}

interface LineChartWidgetProps {
  data: ChartDataPoint[];
  xKey: string;
  lines: LineConfig[];
  showGrid?: boolean;
  showLegend?: boolean;
  formatTooltip?: (value: number) => string;
  formatYAxis?: (value: number) => string;
  referenceLines?: Array<{
    y: number;
    label: string;
    color?: string;
  }>;
  syncId?: string;
}

export default function LineChartWidget({
  data,
  xKey,
  lines,
  showGrid = true,
  showLegend = true,
  formatTooltip,
  formatYAxis,
  referenceLines = [],
  syncId,
}: LineChartWidgetProps) {
  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} syncId={syncId}>
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
            return formatTooltip ? formatTooltip(numValue) : defaultFormatter(numValue);
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            formatter={(value: string) => <span className="text-grey-300 text-sm">{value}</span>}
          />
        )}
        {referenceLines.map((ref, index) => (
          <ReferenceLine
            key={index}
            y={ref.y}
            label={{
              value: ref.label,
              fill: ref.color || "#9CA3AF",
              fontSize: 12,
            }}
            stroke={ref.color || "#9CA3AF"}
            strokeDasharray="5 5"
          />
        ))}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            dot={line.dot !== false ? { r: 4, fill: line.color } : false}
            activeDot={{ r: 6, fill: line.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
