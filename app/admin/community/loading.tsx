import {
  StatCardSkeleton,
  TableSkeleton,
  WidgetSkeleton,
} from "@modules/admin/components/ui/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Moderation queue and activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton rows={6} columns={5} />
        </div>
        <WidgetSkeleton items={5} />
      </div>
    </div>
  );
}
