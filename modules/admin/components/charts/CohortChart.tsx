"use client";

import { useMemo } from "react";

import { cn } from "@lib/utils/style";

interface CohortData {
  cohort: string;
  cohortSize: number;
  periods: number[]; // Retention percentage for each period
}

interface CohortChartProps {
  data: CohortData[];
  periodLabel?: string;
  showAbsoluteNumbers?: boolean;
  colorScale?: {
    low: string;
    mid: string;
    high: string;
  };
}

const DEFAULT_COLORS = {
  low: "#ef4444", // Red - low retention
  mid: "#fbbf24", // Yellow - medium
  high: "#22c55e", // Green - high retention
};

function interpolateColor(
  value: number,
  colors: { low: string; mid: string; high: string }
): string {
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const lowColor = parseHex(colors.low);
  const midColor = parseHex(colors.mid);
  const highColor = parseHex(colors.high);

  let r: number, g: number, b: number;
  const ratio = value / 100;

  if (ratio <= 0.5) {
    const localRatio = ratio * 2;
    r = Math.round(lowColor.r + (midColor.r - lowColor.r) * localRatio);
    g = Math.round(lowColor.g + (midColor.g - lowColor.g) * localRatio);
    b = Math.round(lowColor.b + (midColor.b - lowColor.b) * localRatio);
  } else {
    const localRatio = (ratio - 0.5) * 2;
    r = Math.round(midColor.r + (highColor.r - midColor.r) * localRatio);
    g = Math.round(midColor.g + (highColor.g - midColor.g) * localRatio);
    b = Math.round(midColor.b + (highColor.b - midColor.b) * localRatio);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

export default function CohortChart({
  data,
  periodLabel = "Week",
  showAbsoluteNumbers = false,
  colorScale = DEFAULT_COLORS,
}: CohortChartProps) {
  // Calculate max periods for consistent column count
  const maxPeriods = useMemo(() => {
    return Math.max(...data.map((d) => d.periods.length));
  }, [data]);

  // Calculate period headers
  const periodHeaders = useMemo(() => {
    return Array.from({ length: maxPeriods }, (_, i) => `${periodLabel} ${i}`);
  }, [maxPeriods, periodLabel]);

  // Calculate average retention per period
  const avgRetention = useMemo(() => {
    return periodHeaders.map((_, periodIndex) => {
      const validValues = data.map((d) => d.periods[periodIndex]).filter((v) => v !== undefined);
      if (validValues.length === 0) return 0;
      return Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length);
    });
  }, [data, periodHeaders]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-grey-400 bg-grey-900 sticky left-0 z-10 p-3 text-left font-medium">
              Cohort
            </th>
            <th className="text-grey-400 bg-grey-900 p-3 text-center font-medium">Users</th>
            {periodHeaders.map((header, i) => (
              <th key={i} className="text-grey-400 bg-grey-900 p-3 text-center font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cohort) => (
            <tr key={cohort.cohort} className="border-grey-800 border-t">
              <td className="bg-grey-900 sticky left-0 z-10 p-3 font-medium text-white">
                {cohort.cohort}
              </td>
              <td className="bg-grey-800 p-3 text-center text-white">
                {cohort.cohortSize.toLocaleString()}
              </td>
              {periodHeaders.map((_, periodIndex) => {
                const value = cohort.periods[periodIndex];
                if (value === undefined) {
                  return (
                    <td key={periodIndex} className="bg-grey-900 p-3 text-center">
                      <span className="text-grey-600">—</span>
                    </td>
                  );
                }

                const bgColor = interpolateColor(value, colorScale);
                const absoluteValue = Math.round((cohort.cohortSize * value) / 100);

                return (
                  <td
                    key={periodIndex}
                    className={cn(
                      "p-3 text-center transition-all hover:ring-2 hover:ring-white/30",
                      value >= 50 ? "text-white" : "text-white/90"
                    )}
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="font-medium">{value}%</span>
                    {showAbsoluteNumbers && (
                      <span className="mt-0.5 block text-xs opacity-75">
                        ({absoluteValue.toLocaleString()})
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Average Row */}
          <tr className="border-grey-700 border-t-2">
            <td className="bg-grey-800 sticky left-0 z-10 p-3 font-bold text-white">Average</td>
            <td className="bg-grey-700 p-3 text-center font-bold text-white">
              {Math.round(
                data.reduce((sum, d) => sum + d.cohortSize, 0) / data.length
              ).toLocaleString()}
            </td>
            {avgRetention.map((avg, i) => (
              <td key={i} className="bg-grey-700 p-3 text-center font-bold text-white">
                {avg > 0 ? `${avg}%` : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: colorScale.low }} />
          <span className="text-grey-400 text-xs">Low (&lt;40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: colorScale.mid }} />
          <span className="text-grey-400 text-xs">Medium (40-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: colorScale.high }} />
          <span className="text-grey-400 text-xs">High (&gt;70%)</span>
        </div>
      </div>
    </div>
  );
}
