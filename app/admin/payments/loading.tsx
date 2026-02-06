import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@modules/admin/components/ui/Skeleton";

export default function PaymentsLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* Revenue stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Revenue chart */}
      <ChartSkeleton height="h-80" />

      {/* Transactions table */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
