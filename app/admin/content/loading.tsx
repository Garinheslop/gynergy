import { TableSkeleton, Skeleton } from "@modules/admin/components/ui/Skeleton";

export default function ContentLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* Tab navigation skeleton */}
      <div className="border-grey-800 flex gap-4 border-b pb-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content table */}
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
