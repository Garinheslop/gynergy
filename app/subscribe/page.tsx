"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserClient } from "@supabase/ssr";

export default function SubscribePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setIsAuthenticated(!!data.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const productType = selectedPlan === "annual" ? "journal_annual" : "journal_monthly";
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType }),
      });

      if (response.status === 401) {
        setError("Please sign in to continue.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        setError(data.error);
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="mb-4 inline-block bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
          G Y N E R G Y
        </span>
        <h1 className="mb-6 text-4xl leading-tight font-bold md:text-5xl">
          Your Challenge Is Complete.
          <br />
          <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
            Your Practice Doesn&apos;t Have to End.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-300">
          You&apos;ve built the habit. You&apos;ve seen the results. Continue your morning and
          evening journals, daily gratitude actions, AI coaching, and streak tracking with a
          subscription.
        </p>
      </section>

      {/* What You Keep */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 md:p-12">
          <h2 className="mb-6 text-2xl font-bold">Everything You Need to Keep Growing</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Morning Journal",
                desc: "Mood, mantra, affirmations, gratitudes, excitements",
              },
              {
                title: "Evening Reflection",
                desc: "Insights, successes, intentions, dream capture",
              },
              { title: "Daily Gratitude Action", desc: "Kindness made tangible, tracked daily" },
              { title: "Vision System", desc: "Highest Self, mantra, creed, and discovery" },
              { title: "Weekly Reflection", desc: "Wins, challenges, and lessons learned" },
              { title: "AI Coaching", desc: "Yesi and Garin analyze your entries and guide you" },
              { title: "Streaks & Badges", desc: "Visual accountability and achievements" },
              { title: "Community Access", desc: "Stay connected with the Gynergy alumni network" },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-3 rounded-xl bg-white/5 p-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
                  <svg
                    className="h-3.5 w-3.5 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">Continue Your Practice</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`rounded-2xl border p-6 text-left transition-all ${
              selectedPlan === "monthly"
                ? "border-teal-500 bg-teal-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-400">Monthly</p>
              <p className="text-3xl font-bold">
                $39.95<span className="text-lg font-normal text-gray-400">/mo</span>
              </p>
            </div>
            <p className="text-sm text-gray-400">Cancel anytime. No commitments.</p>
          </button>

          {/* Annual */}
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`relative rounded-2xl border p-6 text-left transition-all ${
              selectedPlan === "annual"
                ? "border-teal-500 bg-teal-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <span className="absolute -top-3 right-4 rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-black">
              SAVE $80
            </span>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-400">Annual</p>
              <p className="text-3xl font-bold">
                $399<span className="text-lg font-normal text-gray-400">/yr</span>
              </p>
              <p className="text-sm text-teal-400">$33.25/mo — save $80/year</p>
            </div>
            <p className="text-sm text-gray-400">Best value. Commit to your growth.</p>
          </button>
        </div>

        {isAuthenticated === false ? (
          <button
            onClick={() => router.push("/login?redirect=/subscribe")}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-4 text-lg font-bold text-black transition-all hover:from-teal-400 hover:to-cyan-400"
          >
            Sign In to Continue
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={loading || isAuthenticated === null}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-4 text-lg font-bold text-black transition-all hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Continue My Practice"}
          </button>
        )}

        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

        <p className="mt-4 text-center text-sm text-gray-500">
          Secure checkout powered by Stripe. Cancel anytime from your account settings.
        </p>
      </section>

      {/* Back to Home */}
      <section className="pb-12 text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 underline transition-colors hover:text-gray-300"
        >
          Return to Home
        </Link>
      </section>
    </div>
  );
}
