"use client";

import { useMemo } from "react";

import { FunnelChart, Funnel, Cell, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface FunnelDataPoint {
  name: string;
  value: number;
  fill?: string;
}

interface FunnelChartWidgetProps {
  data: FunnelDataPoint[];
  colors?: string[];
  showLabels?: boolean;
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#15b79e", // Teal - Top of funnel
  "#14a389", // Slightly darker
  "#139478", // Mid funnel
  "#108569", // Darker
  "#0d755a", // Bottom of funnel
];

export default function FunnelChartWidget({
  data,
  colors = DEFAULT_COLORS,
  showLabels = true,
  showPercentage = true,
  formatValue,
}: FunnelChartWidgetProps) {
  // Calculate conversion rates between stages
  const dataWithRates = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      rate: index === 0 ? 100 : ((item.value / data[0].value) * 100).toFixed(1),
      stageRate: index === 0 ? 100 : ((item.value / data[index - 1].value) * 100).toFixed(1),
    }));
  }, [data]);

  const defaultFormatter = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  return (
    <div className="flex h-full w-full">
      {/* Funnel Visualization */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
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
                return [formatValue ? formatValue(numValue) : defaultFormatter(numValue), "Users"];
              }}
            />
            <Funnel dataKey="value" data={dataWithRates} isAnimationActive animationDuration={800}>
              {dataWithRates.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || colors[index % colors.length]} />
              ))}
              {showLabels && (
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="name"
                  className="text-sm font-medium"
                />
              )}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Metrics Sidebar */}
      {showPercentage && (
        <div className="ml-4 flex w-48 flex-col justify-center space-y-3">
          {dataWithRates.map((item, index) => (
            <div key={item.name} className="bg-grey-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-grey-400 text-xs">{item.name}</span>
                <span className="text-sm font-bold text-white">
                  {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                </span>
              </div>
              {index > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="bg-grey-700 h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.rate}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                  <span className="text-grey-400 text-xs">{item.rate}%</span>
                </div>
              )}
              {index > 0 && (
                <p className="text-grey-500 mt-1 text-xs">{item.stageRate}% from previous</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
