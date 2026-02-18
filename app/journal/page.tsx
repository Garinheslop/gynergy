"use client";

import { useState } from "react";

import Link from "next/link";

import { WEBINAR_TESTIMONIALS } from "@modules/landing/data/webinar-content";

export default function JournalSalesPage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const productType = selectedPlan === "annual" ? "journal_annual" : "journal_monthly";
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  // Pick 3 testimonials relevant to daily practice
  const testimonials = WEBINAR_TESTIMONIALS.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="mb-4 inline-block bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
          G Y N E R G Y
        </span>
        <h1 className="mb-6 text-4xl leading-tight font-bold md:text-5xl">
          What Happens After Day 45?
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-300">
          Most programs end. The habit dies. Three months later you&apos;re back to empty. The
          journal keeps the practice alive.
        </p>
      </section>

      {/* The Problem */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 md:p-12">
          <h2 className="mb-6 text-2xl font-bold">The Practice That Changes Everything</h2>
          <p className="mb-4 text-gray-300">
            10 minutes every morning. Mood tracking, affirmations, gratitudes, excitements. 10
            minutes every evening. Reflections, insights, tomorrow&apos;s intentions. One daily act
            of kindness. Written down. Witnessed.
          </p>
          <p className="mb-6 text-gray-300">
            The men who sustained their transformation had one thing in common:{" "}
            <span className="font-semibold text-white">they kept the daily practice</span>. Not the
            calls. Not the community. The practice.
          </p>

          {/* Features */}
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
              { title: "Streak Tracking", desc: "Visual accountability that won't let you quit" },
              { title: "AI Coaching", desc: "Yesi analyzes your entries and surfaces patterns" },
              { title: "Progress Analytics", desc: "Watch your Five Pillar score climb over time" },
              { title: "DGA Practice", desc: "Daily Gratitude Action — kindness made tangible" },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border border-white/5 bg-black/20 p-4">
                <h3 className="mb-1 font-semibold text-teal-400">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">What Men Say About the Practice</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6"
            >
              <p className="mb-4 text-sm leading-relaxed text-gray-300 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-white">{t.author}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
                <p className="mt-1 text-xs font-medium text-teal-400">{t.result}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">Continue Your Practice</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`rounded-xl border p-6 text-left transition-all ${
              selectedPlan === "monthly"
                ? "border-teal-500 bg-teal-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <p className="mb-1 text-sm font-medium text-gray-400">Monthly</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">$39.95</span>
              <span className="text-gray-400">/mo</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Cancel anytime</p>
          </button>

          {/* Annual */}
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`relative rounded-xl border p-6 text-left transition-all ${
              selectedPlan === "annual"
                ? "border-teal-500 bg-teal-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <span className="absolute -top-3 right-4 rounded-full bg-teal-500 px-3 py-0.5 text-xs font-semibold text-black">
              Save $80
            </span>
            <p className="mb-1 text-sm font-medium text-gray-400">Annual</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">$399</span>
              <span className="text-gray-400">/year</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">$33.25/mo — best value</p>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-center text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300 disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : selectedPlan === "annual"
              ? "Start Annual Practice — $399/year"
              : "Start Monthly Practice — $39.95/month"}
        </button>
      </section>

      {/* Objection Handling */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
          <h3 className="mb-4 text-lg font-semibold text-white">
            &ldquo;Can&apos;t I just do this in a notebook?&rdquo;
          </h3>
          <p className="text-gray-300">
            You can. But the streak tracking, AI coaching, mood analytics, and structured prompts —
            that&apos;s what keeps men from quitting on Week 3. A notebook doesn&apos;t watch you. A
            notebook doesn&apos;t notice when you skip a day. The journal does.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <p className="mb-6 text-lg text-gray-300">
          You didn&apos;t do 45 days to go back to nothing.
          <br />
          <span className="font-semibold text-white">Keep the practice. Keep the progress.</span>
        </p>
        <Link href="/assessment" className="text-sm text-teal-400 hover:underline">
          Not sure yet? Take the free Five Pillar Assessment first &rarr;
        </Link>
      </section>
    </div>
  );
}
