"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = "gynergy-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if previously dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    // Detect iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      // iOS doesn't support beforeinstallprompt, show custom instructions
      setShowPrompt(true);
      return;
    }

    // Handle Android/Chrome install prompt
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
      }
    } catch {
      // User cancelled or error
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  }, []);

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="animate-slide-up fixed right-0 bottom-0 left-0 z-50 p-4">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img src="/icons/icon-72x72.png" alt="Gynergy" className="h-12 w-12 rounded-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900">Install Gynergy</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              {isIOS
                ? "Add to your home screen for the best experience"
                : "Install for quick access and offline support"}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <span>Tap</span>
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>then &ldquo;Add to Home Screen&rdquo;</span>
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Install
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
