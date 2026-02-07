"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartWidgetProps {
  data: PieDataPoint[];
  colors?: string[];
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#15b79e", // Teal
  "#a86cff", // Purple
  "#ffc878", // Gold
  "#f87171", // Red
  "#60a5fa", // Blue
  "#34d399", // Green
  "#fb923c", // Orange
  "#c084fc", // Violet
];

export default function PieChartWidget({
  data,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showLabels = false,
  innerRadius = 60,
  outerRadius = 100,
  formatValue,
}: PieChartWidgetProps) {
  // Calculate total for percentage display
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  // Custom label renderer - matches PieLabelRenderProps
  const renderLabel = (props: { name?: string; percent?: number }) => {
    const name = props.name || "";
    const percent = props.percent || 0;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          label={showLabels ? renderLabel : undefined}
          labelLine={showLabels}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${entry.name}-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          labelStyle={{ color: "#9CA3AF" }}
          formatter={(value) => {
            const numValue = typeof value === "number" ? value : 0;
            return [
              formatValue ? formatValue(numValue) : defaultFormatter(numValue),
              `${((numValue / total) * 100).toFixed(1)}%`,
            ];
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value: string) => <span className="text-grey-300 text-sm">{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
