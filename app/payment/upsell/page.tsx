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
        body: JSON.stringify({ productType: "journal_annual" }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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
            One more thing before you get started
          </p>
          <h1 className="mb-6 text-3xl leading-tight font-bold md:text-4xl">
            Lock In the Daily Practice for a Full Year
          </h1>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            The 45-day challenge gives you the foundation. But the men who sustain the
            transformation? They keep the daily journal practice going.
          </p>

          {/* The Offer */}
          <div className="mb-8 rounded-xl border border-teal-500/30 bg-black/30 p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Annual Journal Subscription</h2>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-sm font-semibold text-teal-400">
                Save $80
              </span>
            </div>

            <p className="mb-4 text-gray-300">
              Continue the morning and evening practice beyond Day 45. AI coaching, streak tracking,
              mood analytics, and the full journal experience — for a full year.
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">$399</span>
              <span className="text-gray-400">/year</span>
              <span className="text-sm text-gray-500 line-through">$479/yr at monthly rate</span>
            </div>
            <p className="mt-1 text-sm text-teal-400">
              That&apos;s $1.09/day for the practice that changes everything.
            </p>
          </div>

          {/* Why Now */}
          <p className="mb-8 text-gray-300">
            Men who commit to the annual practice from Day 1 complete the challenge at a{" "}
            <span className="font-semibold text-white">40% higher rate</span>. It&apos;s not about
            the subscription — it&apos;s about the signal you send to yourself:{" "}
            <em>I&apos;m not stopping at 45 days.</em>
          </p>

          {/* CTAs */}
          <div className="space-y-4">
            <button
              onClick={handleAnnualCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-center text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Add Annual Journal — $399/year (Save $80)"}
            </button>

            <button
              onClick={handleSkip}
              className="w-full rounded-lg px-8 py-4 text-center text-base text-gray-400 transition-all hover:text-white"
            >
              No thanks, take me to my dashboard &rarr;
            </button>
          </div>

          {/* Trust Signal */}
          <p className="mt-6 text-center text-sm text-gray-500">
            This is completely optional. Your 45-day challenge is fully paid and ready to go
            regardless of your choice here.
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
