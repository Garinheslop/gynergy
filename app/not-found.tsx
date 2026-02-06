import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="bg-action/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <span className="text-action text-4xl font-bold">404</span>
        </div>

        <h1 className="text-content-dark mb-2 text-2xl font-bold">Page Not Found</h1>
        <p className="text-content-dark-secondary mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="bg-action hover:bg-action/90 inline-block rounded-xl px-6 py-3 font-medium text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
