"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Admin dashboard error:", error);
  }, [error]);

  return (
    <div className="bg-bkg-dark flex min-h-screen items-center justify-center">
      <div className="border-grey-800 bg-grey-900 max-w-md rounded-xl border p-8 text-center">
        <div className="bg-danger/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <i className="gng-error text-danger text-3xl" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>
        <p className="text-grey-400 mb-6 text-sm">
          {error.message || "An unexpected error occurred while loading the dashboard."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="bg-action-600 hover:bg-action-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="border-grey-700 bg-grey-800 text-grey-300 hover:bg-grey-700 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Go home
          </button>
        </div>
        {error.digest && <p className="text-grey-600 mt-4 text-xs">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
