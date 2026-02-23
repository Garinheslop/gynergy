"use client";

import Link from "next/link";

import { cn } from "@lib/utils/style";

interface UpsellBannerProps {
  variant: "subscribe" | "challenge";
  className?: string;
}

const bannerConfig = {
  subscribe: {
    heading: "Continue Your Practice",
    description:
      "Your challenge access has ended. Subscribe for $39.95/mo to keep your journal, AI coaching, streaks, and community access.",
    cta: "Subscribe Now",
    href: "/subscribe",
    gradient: "from-teal-900/30 to-cyan-900/20",
    border: "border-teal-500/30",
    ctaColor: "bg-teal-600 hover:bg-teal-700",
  },
  challenge: {
    heading: "Ready for the Full Transformation?",
    description:
      "Join a 45-Day Challenge Cohort for group coaching calls, cohort leaderboard, accountability partners, and the complete experience.",
    cta: "Learn About the Challenge",
    href: "/",
    gradient: "from-action-900/30 to-purple/10",
    border: "border-action-500/30",
    ctaColor: "bg-action-600 hover:bg-action-700",
  },
};

export default function UpsellBanner({ variant, className }: UpsellBannerProps) {
  const config = bannerConfig[variant];

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-r p-6",
        config.gradient,
        config.border,
        className
      )}
    >
      <h3 className="mb-2 text-lg font-semibold text-white">{config.heading}</h3>
      <p className="text-grey-300 mb-4 text-sm">{config.description}</p>
      <Link
        href={config.href}
        className={cn(
          "inline-block rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors",
          config.ctaColor
        )}
      >
        {config.cta}
      </Link>
    </div>
  );
}
