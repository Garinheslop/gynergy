import { Skeleton } from "@modules/admin/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="bg-bkg-dark min-h-screen space-y-6 p-6">
      {/* Settings sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-grey-800 bg-grey-900 rounded-xl border p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
