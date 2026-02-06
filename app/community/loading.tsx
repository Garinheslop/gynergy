export default function CommunityLoading() {
  return (
    <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-action mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-content-dark-secondary text-sm">Loading community...</p>
      </div>
    </div>
  );
}
