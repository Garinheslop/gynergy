export default function CommunityLoading() {
  return (
    <div className="bg-bkg-light-secondary min-h-screen">
      {/* Hero skeleton */}
      <div className="from-action-700 via-action-600 to-action-400 bg-gradient-to-br">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="text-center">
            <div className="mx-auto mb-2 h-10 w-64 animate-pulse rounded bg-white/10" />
            <div className="mx-auto mb-8 h-5 w-96 max-w-full animate-pulse rounded bg-white/10" />

            {/* Stats skeleton */}
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded bg-white/10 p-4 backdrop-blur">
                  <div className="mx-auto mb-2 h-8 w-12 rounded bg-white/10" />
                  <div className="mx-auto h-4 w-24 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar skeleton */}
        <div className="bg-white/10 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 px-6 py-4">
                  <div className="mx-auto h-4 w-24 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Feed skeleton */}
          <div className="space-y-6 lg:col-span-2">
            {/* Create post CTA skeleton */}
            <div className="border-border-light bg-bkg-light animate-pulse rounded border p-4">
              <div className="flex items-center gap-4">
                <div className="bg-grey-100 h-12 w-12 rounded-full" />
                <div className="bg-grey-200 h-11 flex-1 rounded-full" />
              </div>
            </div>

            {/* Post skeletons */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border-light bg-bkg-light animate-pulse rounded border p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-grey-100 h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <div className="bg-grey-100 h-4 w-32 rounded" />
                    <div className="bg-grey-100 h-3 w-24 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-grey-100 h-4 w-full rounded" />
                  <div className="bg-grey-100 h-4 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="border-border-light bg-bkg-light animate-pulse rounded border p-4">
              <div className="bg-grey-100 mb-3 h-5 w-24 rounded" />
              <div className="bg-grey-100 h-16 rounded" />
            </div>
            <div className="border-border-light bg-bkg-light animate-pulse rounded border p-4">
              <div className="bg-grey-100 mb-3 h-5 w-28 rounded" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-grey-100 h-12 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
