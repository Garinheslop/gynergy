export default function MessagesLoading() {
  return (
    <div className="bg-bkg-dark flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="border-border-dark bg-bkg-dark-secondary border-b px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="bg-bkg-dark-800 h-6 w-32 animate-pulse rounded" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1">
        {/* Conversations list skeleton */}
        <div className="border-border-dark w-full border-r md:w-80">
          <div className="border-border-dark border-b px-4 py-3">
            <div className="bg-bkg-dark-800 h-5 w-28 animate-pulse rounded" />
          </div>
          <div className="divide-border-dark divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-3 px-4 py-3">
                <div className="bg-bkg-dark-800 h-12 w-12 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="bg-bkg-dark-800 h-4 w-24 rounded" />
                  <div className="bg-bkg-dark-800 h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread area skeleton (desktop) */}
        <div className="hidden flex-1 md:flex md:flex-col">
          <div className="border-border-dark flex items-center gap-3 border-b px-4 py-3">
            <div className="bg-bkg-dark-800 h-10 w-10 animate-pulse rounded-full" />
            <div className="bg-bkg-dark-800 h-5 w-32 animate-pulse rounded" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="bg-bkg-dark-800 h-4 w-48 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
