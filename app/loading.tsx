import { LoadingState } from "@modules/common/components/ui/LoadingState";

export default function Loading() {
  return (
    <div className="bg-bkg-light-secondary flex min-h-screen flex-col items-center justify-center gap-6">
      {/* Branded logo animation */}
      <div className="relative">
        <div className="bg-action/20 absolute inset-0 animate-ping rounded-full" />
        <div className="bg-action relative flex h-16 w-16 items-center justify-center rounded-full">
          <i className="gng-logo text-3xl text-white" />
        </div>
      </div>

      {/* Loading indicator */}
      <LoadingState message="Loading your journey..." size="md" variant="dots" />

      {/* Skeleton preview of dashboard */}
      <div className="mt-8 w-full max-w-md animate-pulse px-4">
        <div className="space-y-4">
          <div className="bg-bkg-light rounded-large h-24" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bkg-light rounded-large h-32" />
            <div className="bg-bkg-light rounded-large h-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
