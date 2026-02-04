"use client";

import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { cn } from "@lib/utils/style";
import FriendCodeInput from "@modules/payment/components/FriendCodeInput";
import FriendCodeShare from "@modules/payment/components/FriendCodeShare";
import PricingCard from "@modules/payment/components/PricingCard";
import icons from "@resources/icons";
import { PRICING_TIERS } from "@resources/types/payment";
import { useDispatch, useSelector } from "@store/hooks";
import {
  createCheckoutSession,
  fetchEntitlements,
  redeemFriendCode,
  clearRedeemStatus,
} from "@store/modules/payment";

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, authenticating } = useSession();
  const dispatch = useDispatch();

  const payment = useSelector((state) => state.payment);
  const profile = useSelector((state) => state.profile);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showFriendCodeModal, setShowFriendCodeModal] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  // Check for friend code in URL
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setShowFriendCodeModal(true);
    }
  }, [searchParams]);

  // Fetch entitlements when logged in
  useEffect(() => {
    if (session) {
      dispatch(fetchEntitlements() as any);
    }
  }, [session, dispatch]);

  // Smart redirect: if logged in with challenge access, go to dashboard
  useEffect(() => {
    if (session && !authenticating && !payment.loading && payment.entitlements) {
      setHasCheckedAccess(true);
      if (payment.entitlements.hasChallengeAccess && profile.current?.firstName) {
        router.push("/date-zero-gratitude");
      }
    } else if (!session && !authenticating) {
      setHasCheckedAccess(true);
    }
  }, [session, authenticating, payment.loading, payment.entitlements, profile.current, router]);

  // Clear redeem status when modal closes
  useEffect(() => {
    if (!showFriendCodeModal) {
      dispatch(clearRedeemStatus());
    }
  }, [showFriendCodeModal, dispatch]);

  const handleCheckout = async (
    productType: "challenge" | "journal_monthly" | "journal_annual"
  ) => {
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckoutSession(productType);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutLoading(false);
    }
  };

  const handleRedeemCode = async (code: string) => {
    if (!session) {
      // Store code and redirect to login
      sessionStorage.setItem("pendingFriendCode", code);
      router.push(`/login?redirect=/&code=${code}`);
      return { success: false, error: "Please sign in first" };
    }

    const result = await dispatch(redeemFriendCode(code) as any);
    return result;
  };

  // Show loading state while checking auth/entitlements
  if (!hasCheckedAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  const hasChallengeAccess = payment.entitlements?.hasChallengeAccess;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Image
              src={icons.dateZeroLogo}
              alt="Gynergy"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  {hasChallengeAccess && (
                    <button
                      onClick={() => router.push("/date-zero-gratitude")}
                      className="text-action-600 hover:text-action-700 text-sm font-medium"
                    >
                      Go to Dashboard →
                    </button>
                  )}
                  <span className="text-sm text-gray-500">
                    {profile.current?.firstName || profile.current?.email}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Transform Your Life in <span className="text-action-600">45 Days</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600">
            Join the Awakening Challenge and discover the power of daily gratitude, mindful
            journaling, and community support. Start your journey with 2 friends for the ultimate
            accountability trio.
          </p>

          {/* Social proof */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>4.9/5 rating</span>
            </div>
            <div>78% completion rate</div>
            <div>1,000+ graduates</div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {hasChallengeAccess ? (
              <button
                onClick={() => router.push("/date-zero-gratitude")}
                className="rounded-lg bg-indigo-600 px-8 py-4 text-lg font-bold text-white hover:bg-indigo-700"
              >
                Continue Your Journey →
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCheckout("challenge")}
                  disabled={checkoutLoading}
                  className={cn(
                    "rounded-lg bg-indigo-600 px-8 py-4 text-lg font-bold text-white",
                    "transition-colors hover:bg-indigo-700",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  Start Your Journey - $997
                </button>
                <button
                  onClick={() => setShowFriendCodeModal(true)}
                  className="rounded-lg border-2 border-indigo-600 px-8 py-4 text-lg font-bold text-indigo-600 hover:bg-indigo-50"
                >
                  Have a Friend Code?
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Friend Codes Section (if user has them) */}
      {hasChallengeAccess && payment.friendCodes.length > 0 && (
        <section className="border-y border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <FriendCodeShare friendCodes={payment.friendCodes} />
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {hasChallengeAccess ? "Your Challenge Access" : "Choose Your Path"}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {hasChallengeAccess
                ? "You have access to the 45-Day Challenge. Share your friend codes below!"
                : "Start your transformation journey today"}
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <PricingCard
                key={tier.name}
                tier={tier}
                onCheckout={() => {
                  if (tier.ctaAction === "checkout") {
                    handleCheckout("challenge");
                  } else if (tier.ctaAction === "subscribe") {
                    handleCheckout("journal_monthly");
                  }
                }}
                onFriendCode={() => setShowFriendCodeModal(true)}
                isLoading={checkoutLoading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            What&apos;s Included
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "📝",
                title: "Morning & Evening Journals",
                description:
                  "Guided prompts to start and end your day with intention and reflection.",
              },
              {
                icon: "🙏",
                title: "Daily Gratitude Actions",
                description: "Turn gratitude into action with meaningful daily challenges.",
              },
              {
                icon: "👁️",
                title: "Vision Board & Journey Mapping",
                description: "Visualize your highest self and map your path to transformation.",
              },
              {
                icon: "👥",
                title: "Accountability Trio",
                description:
                  "Get 2 friend codes to bring your support system along for the journey.",
              },
              {
                icon: "🏆",
                title: "Gamification & Badges",
                description: "Earn points, unlock badges, and celebrate your progress.",
              },
              {
                icon: "🤖",
                title: "AI Companion",
                description: "Get personalized insights and support from your AI guide.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-gray-50 p-6 transition-colors hover:bg-gray-100"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "What is the Accountability Trio?",
                a: "When you purchase the challenge, you receive 2 friend codes to share. Research shows groups of 3 have the highest completion rates. Start the journey with friends for maximum accountability and support.",
              },
              {
                q: "What happens after the 45 days?",
                a: "After completing the challenge, you maintain lifetime access to the community. You can continue your growth with our optional Digital Journal subscription ($39.95/month) for ongoing guided journaling and AI insights.",
              },
              {
                q: "Can I do the challenge alone?",
                a: "Absolutely! While we recommend the Accountability Trio for best results, you can complete the challenge solo. You'll still have access to the cohort community for support.",
              },
              {
                q: "What if I miss a day?",
                a: "Life happens! The challenge is designed to be flexible. You can catch up on missed days, and our gamification system rewards consistency without punishing occasional breaks.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-action-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white">Ready to Transform Your Life?</h2>
          <p className="text-action-100 mb-8 text-lg">
            Join thousands who have already started their awakening journey.
          </p>
          {hasChallengeAccess ? (
            <button
              onClick={() => router.push("/date-zero-gratitude")}
              className="rounded-lg bg-white px-8 py-4 text-lg font-bold text-indigo-600 hover:bg-indigo-50"
            >
              Go to Dashboard →
            </button>
          ) : (
            <button
              onClick={() => handleCheckout("challenge")}
              disabled={checkoutLoading}
              className={cn(
                "rounded-lg bg-white px-8 py-4 text-lg font-bold text-indigo-600",
                "transition-colors hover:bg-indigo-50",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              Start Your 45-Day Journey - $997
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Gynergy. All rights reserved.</p>
        </div>
      </footer>

      {/* Friend Code Modal */}
      {showFriendCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <FriendCodeInput
            onRedeem={handleRedeemCode}
            isLoading={payment.redeemingCode}
            error={payment.redeemError}
            success={payment.redeemSuccess}
            onClose={() => setShowFriendCodeModal(false)}
          />
        </div>
      )}
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
