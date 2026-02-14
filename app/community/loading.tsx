import { LoadingState, ListSkeleton } from "@modules/common/components/ui/LoadingState";

export default function CommunityLoading() {
  return (
    <div className="bg-bkg-light-secondary min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="bg-bkg-light h-8 w-40 animate-pulse rounded" />
          <div className="bg-bkg-light h-10 w-32 animate-pulse rounded-full" />
        </div>

        {/* Stats cards skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bkg-light rounded-large animate-pulse p-4">
              <div className="bg-bkg-light-secondary mb-2 h-4 w-1/2 rounded" />
              <div className="bg-bkg-light-secondary h-8 w-3/4 rounded" />
            </div>
          ))}
        </div>

        {/* Leaderboard section */}
        <div className="bg-bkg-light rounded-large p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="bg-bkg-light-secondary h-6 w-32 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-bkg-light-secondary h-8 w-20 animate-pulse rounded-full" />
              <div className="bg-bkg-light-secondary h-8 w-20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Member list skeleton */}
          <ListSkeleton rows={5} />
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <LoadingState message="Loading community..." size="sm" variant="dots" inline />
        </div>
      </div>
    </div>
  );
}
