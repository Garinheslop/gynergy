"use client";

import { useState } from "react";

import Link from "next/link";

export default function CheckoutRecoveryPage() {
  const [loading, setLoading] = useState(false);

  const handleJournalCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: "journal_monthly" }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-4 text-center">
          <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
            G Y N E R G Y
          </span>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 md:p-12">
          <h1 className="mb-6 text-3xl leading-tight font-bold md:text-4xl">
            I respect that you&apos;re thinking it through.
          </h1>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            $997 is not a small number. And the fact that you got to the checkout page tells me you
            felt something. Something that said{" "}
            <em className="text-white">&ldquo;this might be different.&rdquo;</em>
          </p>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            Let me ask you something: was it the money that stopped you? Or was it the voice that
            says{" "}
            <span className="font-semibold text-white">
              &ldquo;this won&apos;t be different&rdquo;
            </span>
            ?
          </p>

          <p className="mb-8 text-lg leading-relaxed text-gray-300">
            Most men tell me it&apos;s the second one.
          </p>

          {/* The Alternative */}
          <div className="mb-8 rounded-xl border border-teal-500/20 bg-black/30 p-6 md:p-8">
            <h2 className="mb-4 text-2xl font-bold text-teal-400">Start With Just the Practice</h2>
            <p className="mb-4 text-gray-300">
              The 10-minute daily journal — the same morning practice I&apos;ve done for 497
              straight days. No calls. No community. Just you and the work.
            </p>
            <p className="mb-2 text-gray-300">
              Try it for 30 days. See what showing up for yourself actually does.
            </p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">$39.95</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Cancel anytime. Zero guilt.</p>
          </div>

          {/* Why It Works */}
          <div className="mb-8 space-y-4">
            <p className="text-gray-300">
              Here&apos;s what happens: after 2-3 weeks, you&apos;ll know. You&apos;ll either
              realize this isn&apos;t for you — and cancel. Or you&apos;ll feel the shift, and
              you&apos;ll want the full experience.
            </p>
            <p className="font-semibold text-white">
              The only wrong move is going back to doing nothing. You clicked for a reason. Honor
              that.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-4">
            <button
              onClick={handleJournalCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-center text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Start the Daily Practice — $39.95/month"}
            </button>

            <Link
              href="/"
              className="block w-full rounded-lg border border-white/20 px-8 py-4 text-center text-lg font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
            >
              I&apos;m ready for the full challenge — $997
            </Link>
          </div>

          {/* Testimonial */}
          <div className="mt-10 rounded-lg border-l-2 border-teal-500 bg-black/20 px-6 py-4">
            <p className="text-gray-300 italic">
              &ldquo;I started with just the journal. Three weeks later I upgraded to the full
              challenge. Best decision I made — but the journal alone changed my mornings.&rdquo;
            </p>
            <p className="mt-2 text-sm text-teal-400">— Michael T., Real Estate Developer</p>
          </div>
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
