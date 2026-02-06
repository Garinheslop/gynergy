"use client";

import { ReactNode } from "react";

import { cn } from "@lib/utils/style";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  height?: number;
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  className,
  height = 300,
}: ChartContainerProps) {
  return (
    <div className={cn("border-grey-800 bg-grey-900 rounded-xl border p-5", className)}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-grey-500 mt-0.5 text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chart Area */}
      <div style={{ height }}>{children}</div>
    </div>
  );
}
