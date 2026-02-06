import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@modules/admin/components/ui/Skeleton";

export default function SystemLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* System status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Performance chart */}
      <ChartSkeleton height="h-64" />

      {/* Logs table */}
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}
