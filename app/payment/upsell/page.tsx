"use client";

import { Suspense, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

function UpsellContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(false);

  const handleAnnualCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "upgrade_annual" }),
      });
      const data = await response.json();
      if (data.upgraded) {
        // Subscription was swapped to annual — go to success page
        const successUrl = sessionId
          ? `/payment/success?session_id=${sessionId}`
          : "/payment/success";
        router.push(successUrl);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const successUrl = sessionId ? `/payment/success?session_id=${sessionId}` : "/payment/success";
    router.push(successUrl);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-4 text-center">
          <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
            G Y N E R G Y
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 md:p-12">
          {/* Casual Opener */}
          <p className="mb-2 text-sm font-medium tracking-wider text-teal-400 uppercase">
            Your journal subscription is included
          </p>
          <h1 className="mb-6 text-3xl leading-tight font-bold md:text-4xl">
            Your Challenge Includes a 90-Day Free Journal Trial
          </h1>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            Your digital journal subscription starts with a 90-day free trial. Your first charge of
            $39.95/mo happens on Day 91. Cancel anytime from your account settings.
          </p>

          {/* What's included */}
          <div className="mb-8 rounded-xl border border-white/10 bg-black/20 p-6">
            <h3 className="mb-3 font-semibold text-white">What you get after the challenge:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-teal-400">&#10003;</span> Morning &amp; evening journal
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">&#10003;</span> AI-personalized Daily Gratitude
                Actions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">&#10003;</span> AI coaching with Yesi &amp; Garin
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">&#10003;</span> Streak tracking &amp; badges
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">&#10003;</span> Alumni community access
              </li>
            </ul>
          </div>

          {/* Annual Upgrade Offer */}
          <div className="mb-8 rounded-xl border border-teal-500/30 bg-black/30 p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Upgrade to Annual &amp; Save $80</h2>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-sm font-semibold text-teal-400">
                Best Value
              </span>
            </div>

            <p className="mb-4 text-gray-300">
              Switch from the auto-included monthly ($39.95/mo) to annual billing and save $80/year.
              Locks in your commitment to the practice.
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">$399</span>
              <span className="text-gray-400">/year</span>
              <span className="text-sm text-gray-500 line-through">$479/yr at monthly rate</span>
            </div>
            <p className="mt-1 text-sm text-teal-400">
              That&apos;s $33.25/mo — less than $1.10/day.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-4">
            <button
              onClick={handleAnnualCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-center text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Upgrade to Annual — $399/year (Save $80)"}
            </button>

            <button
              onClick={handleSkip}
              className="w-full rounded-lg px-8 py-4 text-center text-base text-gray-400 transition-all hover:text-white"
            >
              Keep the monthly plan, take me to my dashboard &rarr;
            </button>
          </div>

          {/* Trust Signal */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Your 45-day challenge is fully paid. Your journal subscription has a 90-day free trial —
            first charge is Day 91. Cancel anytime from Account Settings.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Questions? Email{" "}
          <a href="mailto:support@gynergy.app" className="text-teal-400 hover:underline">
            support@gynergy.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentUpsellPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      }
    >
      <UpsellContent />
    </Suspense>
  );
}
