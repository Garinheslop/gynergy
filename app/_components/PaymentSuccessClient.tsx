"use client";

import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import FriendCodeShare from "@modules/payment/components/FriendCodeShare";
import icons from "@resources/icons";
import { useDispatch, useSelector } from "@store/hooks";
import { fetchEntitlements } from "@store/modules/payment";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const dispatch = useDispatch();
  const payment = useSelector((state) => state.payment);

  const [loading, setLoading] = useState(true);

  const _sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      if (session) {
        dispatch(fetchEntitlements() as any);
      }
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, dispatch]);

  // Refetch periodically until we have friend codes
  useEffect(() => {
    if (!loading && session && payment.friendCodes.length === 0) {
      const interval = setInterval(() => {
        dispatch(fetchEntitlements() as any);
      }, 3000);

      // Stop after 30 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [loading, session, payment.friendCodes.length, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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

            {payment.friendCodes.length === 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Your friend codes are being generated. They&apos;ll appear here shortly...
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
                  <p className="font-medium text-gray-900">Share your friend codes</p>
                  <p className="text-sm text-gray-600">
                    Invite 2 friends to form your Accountability Trio
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
