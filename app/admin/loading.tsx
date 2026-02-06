import { DashboardSkeleton } from "@modules/admin/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen p-6">
      <DashboardSkeleton />
    </div>
  );
}
