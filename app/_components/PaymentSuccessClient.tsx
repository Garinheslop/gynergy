"use client";

import { Suspense, useCallback, useEffect, useState, useMemo } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import FriendCodeShare from "@modules/payment/components/FriendCodeShare";
import icons from "@resources/icons";
import { useDispatch, useSelector } from "@store/hooks";
import { fetchEntitlements } from "@store/modules/payment";

// Confetti celebration component
function Confetti({ show }: Readonly<{ show: boolean }>) {
  const particles = useMemo(() => {
    const colors = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"];
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }));
  }, []);

  if (!show) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              backgroundColor: p.color,
              left: `${p.left}%`,
              top: "-20px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `rotate(${p.rotation}deg)`,
              animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}

type PollingStatus = "waiting" | "polling" | "success" | "timeout" | "error";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const dispatch = useDispatch();
  const payment = useSelector((state) => state.payment);

  const [loading, setLoading] = useState(true);
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>("waiting");
  const [pollCount, setPollCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const _sessionId = searchParams.get("session_id");

  const fetchWithRetry = useCallback(async () => {
    if (!session) return;
    try {
      await dispatch(fetchEntitlements());
    } catch {
      setPollingStatus("error");
    }
  }, [session, dispatch]);

  const handleManualRetry = useCallback(() => {
    setPollingStatus("polling");
    setPollCount(0);
    fetchWithRetry();
  }, [fetchWithRetry]);

  useEffect(() => {
    // Give webhook more time to process (5s instead of 2s)
    const timer = setTimeout(() => {
      fetchWithRetry();
      setLoading(false);
      setPollingStatus("polling");
    }, 5000);

    return () => clearTimeout(timer);
  }, [fetchWithRetry]);

  // Refetch periodically until we have friend codes (60s instead of 30s)
  useEffect(() => {
    if (!loading && session && payment.friendCodes.length === 0 && pollingStatus === "polling") {
      const interval = setInterval(() => {
        setPollCount((prev) => prev + 1);
        fetchWithRetry();
      }, 3000);

      // Stop after 60 seconds (20 attempts at 3s each)
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (payment.friendCodes.length === 0) {
          setPollingStatus("timeout");
        }
      }, 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [loading, session, payment.friendCodes.length, pollingStatus, fetchWithRetry]);

  // Update status when friend codes arrive
  useEffect(() => {
    if (payment.friendCodes.length > 0) {
      setPollingStatus("success");
    }
  }, [payment.friendCodes.length]);

  // Trigger confetti celebration when loading completes
  useEffect(() => {
    if (!loading) {
      setShowConfetti(true);
      // Stop confetti after animation completes
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Celebration Confetti */}
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-center">
            <Image
              src={icons.dateZeroLogo}
              alt="Date Zero"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16">
        {/* Success Message */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            {loading ? (
              <svg className="h-10 w-10 animate-spin text-green-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {loading ? "Processing Your Purchase..." : "Welcome to the 45-Day Awakening Challenge!"}
          </h1>

          <p className="text-lg text-gray-600">
            {loading
              ? "Please wait while we set up your account..."
              : "Your journey to transformation begins now. Check your email for a confirmation and get ready to start!"}
          </p>
        </div>

        {/* Friend Codes */}
        {!loading && (
          <div className="mb-12">
            <FriendCodeShare friendCodes={payment.friendCodes} />

            {payment.friendCodes.length === 0 && pollingStatus === "polling" && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    Generating your friend codes... {pollCount > 0 && `(attempt ${pollCount + 1})`}
                  </span>
                </div>
              </div>
            )}

            {pollingStatus === "timeout" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="mb-2 text-sm font-medium text-amber-800">
                  Taking longer than expected...
                </p>
                <p className="mb-4 text-sm text-amber-700">
                  Your purchase was successful! Your friend codes should arrive in your email
                  shortly. You can also try refreshing.
                </p>
                <button
                  onClick={handleManualRetry}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {pollingStatus === "error" && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="mb-2 text-sm font-medium text-red-800">Something went wrong</p>
                <p className="mb-4 text-sm text-red-700">
                  Don&apos;t worry - your purchase was successful. Your friend codes will be sent to
                  your email. If you don&apos;t receive them within 10 minutes, please contact
                  support.
                </p>
                <button
                  onClick={handleManualRetry}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        {!loading && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">What&apos;s Next?</h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-action-100 text-action-700 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900">Share your friend code</p>
                  <p className="text-sm text-gray-600">
                    Invite 1 friend to form your Accountability Duo
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-action-100 text-action-700 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900">Set up your profile</p>
                  <p className="text-sm text-gray-600">
                    Complete your vision board and journey mapping
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-action-100 text-action-700 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900">Start Day 1</p>
                  <p className="text-sm text-gray-600">
                    Begin your morning journal and daily gratitude action
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push("/date-zero-gratitude")}
            className="bg-action-600 hover:bg-action-700 rounded-lg px-8 py-4 text-lg font-bold text-white transition-colors"
          >
            Go to Your Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function PaymentSuccessClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
