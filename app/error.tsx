"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useDispatch } from "react-redux";

import { pagePaths } from "@resources/paths";
import { signOutAndReset } from "@store/modules/profile";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Log error to console in development
    console.error("App Error:", error);
  }, [error]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    reset();
  };

  const handleGoHome = () => {
    router.push(pagePaths.home);
  };

  const handleSignOut = () => {
    dispatch(signOutAndReset());
    router.push(pagePaths.home);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center p-4">
      <div className="bg-bkg-light w-full max-w-md rounded-2xl p-6 shadow-lg">
        {/* Error icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <i className="gng-alert text-3xl text-red-500" />
          </div>
        </div>

        {/* Error message */}
        <h1 className="text-content-dark mb-2 text-center text-xl font-bold">
          Something Went Wrong
        </h1>
        <p className="text-content-dark-secondary mb-6 text-center">
          {retryCount > 2
            ? "This error keeps happening. Try signing out and back in."
            : "Don't worry, your data is safe. Try refreshing or go back to the home page."}
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          {retryCount <= 2 && (
            <button
              onClick={handleRetry}
              className="bg-action hover:bg-action-100 w-full rounded-lg px-4 py-3 font-medium text-white transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={handleGoHome}
            className="border-border-light text-content-dark hover:bg-bkg-light-secondary w-full rounded-lg border px-4 py-3 font-medium transition-colors"
          >
            Go to Home
          </button>

          {retryCount > 1 && (
            <button
              onClick={handleSignOut}
              className="text-content-dark-secondary hover:text-content-dark w-full py-2 text-sm underline transition-colors"
            >
              Sign Out & Refresh
            </button>
          )}
        </div>

        {/* Error details (collapsible) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-content-dark-secondary flex w-full items-center justify-between text-sm"
            >
              <span>Error Details</span>
              <i
                className={`gng-chevron-down transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
            </button>
            {showDetails && (
              <div className="mt-2 overflow-auto rounded bg-gray-100 p-3">
                <p className="mb-1 text-xs font-medium text-gray-600">
                  {error.name}: {error.message}
                </p>
                {error.digest && <p className="text-xs text-gray-500">Digest: {error.digest}</p>}
                {error.stack && (
                  <pre className="mt-2 max-h-32 overflow-auto text-xs text-gray-500">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Support link */}
        <p className="text-content-dark-secondary mt-6 text-center text-xs">
          If this keeps happening,{" "}
          <a
            href="mailto:bitechxconnect+kojwp6mtw4hinjw7vdoe@boards.trello.com"
            className="text-action underline"
          >
            report a bug
          </a>
        </p>
      </div>
    </div>
  );
}
