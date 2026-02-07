"use client";

import { useMemo } from "react";

import { cn } from "@lib/utils/style";

interface HeatmapData {
  row: string;
  col: string;
  value: number;
}

interface HeatmapWidgetProps {
  data: HeatmapData[];
  rows: string[];
  cols: string[];
  colorScale?: {
    min: string;
    mid: string;
    max: string;
  };
  showValues?: boolean;
  formatValue?: (value: number) => string;
  title?: string;
}

const DEFAULT_COLORS = {
  min: "#1F2937", // Dark grey (low)
  mid: "#15b79e", // Teal (medium)
  max: "#ffc878", // Gold (high)
};

// Interpolate between colors based on value
function interpolateColor(
  value: number,
  min: number,
  max: number,
  colors: { min: string; mid: string; max: string }
): string {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);

  // Parse hex colors
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

  const minColor = parseHex(colors.min);
  const midColor = parseHex(colors.mid);
  const maxColor = parseHex(colors.max);

  // Two-part interpolation: min->mid (0-0.5), mid->max (0.5-1)
  let r: number, g: number, b: number;

  if (ratio <= 0.5) {
    const localRatio = ratio * 2;
    r = Math.round(minColor.r + (midColor.r - minColor.r) * localRatio);
    g = Math.round(minColor.g + (midColor.g - minColor.g) * localRatio);
    b = Math.round(minColor.b + (midColor.b - minColor.b) * localRatio);
  } else {
    const localRatio = (ratio - 0.5) * 2;
    r = Math.round(midColor.r + (maxColor.r - midColor.r) * localRatio);
    g = Math.round(midColor.g + (maxColor.g - midColor.g) * localRatio);
    b = Math.round(midColor.b + (maxColor.b - midColor.b) * localRatio);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

export default function HeatmapWidget({
  data,
  rows,
  cols,
  colorScale = DEFAULT_COLORS,
  showValues = true,
  formatValue,
  title,
}: HeatmapWidgetProps) {
  // Create a lookup map for quick access
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      map.set(`${d.row}-${d.col}`, d.value);
    });
    return map;
  }, [data]);

  // Calculate min/max for color scaling
  const { min, max } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  const defaultFormatter = (value: number) => value.toLocaleString();

  return (
    <div className="flex h-full w-full flex-col">
      {title && <h4 className="text-grey-300 mb-3 text-sm font-medium">{title}</h4>}

      <div className="flex flex-1 flex-col">
        {/* Column Headers */}
        <div className="ml-16 flex">
          {cols.map((col) => (
            <div key={col} className="text-grey-400 flex-1 px-1 text-center text-xs font-medium">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="mt-1 flex flex-1 flex-col gap-1">
          {rows.map((row) => (
            <div key={row} className="flex flex-1 items-center gap-1">
              {/* Row Label */}
              <div className="text-grey-400 w-16 text-right text-xs font-medium">{row}</div>

              {/* Cells */}
              <div className="flex flex-1 gap-1">
                {cols.map((col) => {
                  const value = dataMap.get(`${row}-${col}`) ?? 0;
                  const bgColor = interpolateColor(value, min, max, colorScale);

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={cn(
                        "flex flex-1 items-center justify-center rounded transition-all hover:ring-2 hover:ring-white/20",
                        "min-h-[32px] cursor-pointer"
                      )}
                      style={{ backgroundColor: bgColor }}
                      title={`${row}, ${col}: ${formatValue ? formatValue(value) : value}`}
                    >
                      {showValues && (
                        <span className="text-xs font-medium text-white/90">
                          {formatValue ? formatValue(value) : defaultFormatter(value)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-grey-500 text-xs">Low</span>
          <div
            className="h-3 w-32 rounded"
            style={{
              background: `linear-gradient(to right, ${colorScale.min}, ${colorScale.mid}, ${colorScale.max})`,
            }}
          />
          <span className="text-grey-500 text-xs">High</span>
        </div>
      </div>
    </div>
  );
}

// Preset: Engagement by Day/Hour
export function EngagementHeatmap({
  data,
  ...props
}: Omit<HeatmapWidgetProps, "rows" | "cols"> & { data: HeatmapData[] }) {
  const hours = [
    "12am",
    "2am",
    "4am",
    "6am",
    "8am",
    "10am",
    "12pm",
    "2pm",
    "4pm",
    "6pm",
    "8pm",
    "10pm",
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return <HeatmapWidget data={data} rows={days} cols={hours} {...props} />;
}

// Preset: Retention Cohort Heatmap
export function RetentionHeatmap({
  data,
  cohorts,
  weeks,
  ...props
}: Omit<HeatmapWidgetProps, "rows" | "cols"> & {
  data: HeatmapData[];
  cohorts: string[];
  weeks: string[];
}) {
  return (
    <HeatmapWidget
      data={data}
      rows={cohorts}
      cols={weeks}
      formatValue={(v) => `${v}%`}
      {...props}
    />
  );
}
