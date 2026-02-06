import { StatCardSkeleton, ChartSkeleton } from "@modules/admin/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
      </div>

      <ChartSkeleton height="h-96" />
    </div>
  );
}
