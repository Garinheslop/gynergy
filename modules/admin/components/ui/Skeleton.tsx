"use client";

import { cn } from "@lib/utils/style";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("bg-grey-800 animate-pulse rounded-lg", className)} />;
}

// Stat card skeleton for dashboard KPIs
export function StatCardSkeleton() {
  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton className={cn("w-full", height)} />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-grey-800 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border">
      <div className="border-grey-800 border-b p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-grey-800 bg-grey-900/50 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Widget skeleton (for activity feeds, alerts, etc.)
export function WidgetSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border">
      <div className="border-grey-800 border-b p-4">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// User card skeleton
export function UserCardSkeleton() {
  return (
    <div className="border-grey-800 bg-grey-900 flex items-center gap-4 rounded-lg border p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

// Dashboard overview skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WidgetSkeleton />
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
    </div>
  );
}

// Panel slide-out skeleton
export function PanelSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-grey-800 rounded-lg p-3 text-center">
          <Skeleton className="mx-auto h-6 w-16" />
          <Skeleton className="mx-auto mt-1 h-3 w-12" />
        </div>
        <div className="bg-grey-800 rounded-lg p-3 text-center">
          <Skeleton className="mx-auto h-6 w-16" />
          <Skeleton className="mx-auto mt-1 h-3 w-12" />
        </div>
        <div className="bg-grey-800 rounded-lg p-3 text-center">
          <Skeleton className="mx-auto h-6 w-16" />
          <Skeleton className="mx-auto mt-1 h-3 w-12" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
