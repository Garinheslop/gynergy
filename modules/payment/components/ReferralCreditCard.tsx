"use client";

import { useEffect, useState } from "react";

interface ReferralCredit {
  id: string;
  slug: string;
  shareUrl: string;
  options: Array<{
    creditType: string;
    creditAmountCents: number;
    friendPaysCents: number;
  }>;
  isRedeemed: boolean;
  redeemedAt: string | null;
  redeemerEmail: string | null;
  createdAt: string;
}

export default function ReferralCreditCard() {
  const [credits, setCredits] = useState<ReferralCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/referral-credit");
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits || []);
        }
      } catch {
        // Silently fail — card just shows empty state
      } finally {
        setLoading(false);
      }
    }
    fetchCredits();
  }, []);

  const activeCredit = credits.find((c) => !c.isRedeemed);
  const redeemedCredits = credits.filter((c) => c.isRedeemed);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (url: string) => {
    const text =
      "I just completed a life-changing program. Here's a special credit for you to join:";
    if (navigator.share) {
      navigator.share({ title: "Gynergy Referral Credit", text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-3 h-5 w-1/3 rounded bg-gray-200" />
        <div className="h-12 rounded bg-gray-100" />
      </div>
    );
  }

  if (credits.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-4">
        <h3 className="text-lg font-bold text-black">Share Your Credit</h3>
        <p className="text-sm text-amber-900">
          Gift a friend a discount on the 45-Day Awakening Challenge
        </p>
      </div>

      <div className="space-y-4 p-6">
        {activeCredit && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3">
              <span className="flex-1 truncate font-mono text-sm text-amber-800">
                {activeCredit.shareUrl}
              </span>
              <button
                onClick={() => handleCopy(activeCredit.shareUrl)}
                className="shrink-0 rounded bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => handleShare(activeCredit.shareUrl)}
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Share with a Friend
            </button>

            {activeCredit.options.length > 0 && (
              <p className="text-center text-xs text-gray-500">
                Your friend saves ${(activeCredit.options[0].creditAmountCents / 100).toFixed(0)} on
                their purchase
              </p>
            )}
          </div>
        )}

        {redeemedCredits.length > 0 && (
          <div className="space-y-2">
            {redeemedCredits.map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-green-800">Credit Redeemed</p>
                  <p className="text-xs text-green-600">
                    {credit.redeemerEmail || "A friend"} joined
                    {credit.redeemedAt && ` on ${new Date(credit.redeemedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-green-600"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
