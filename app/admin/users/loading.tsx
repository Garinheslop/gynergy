import { TableSkeleton } from "@modules/admin/components/ui/Skeleton";

export default function UsersLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen p-6">
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
