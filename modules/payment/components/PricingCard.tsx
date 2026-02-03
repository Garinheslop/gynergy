"use client";

import { cn } from "@lib/utils/style";
import { PricingTier } from "@resources/types/payment";

interface PricingCardProps {
  tier: PricingTier;
  onCheckout: () => void;
  onFriendCode: () => void;
  isLoading?: boolean;
}

export default function PricingCard({
  tier,
  onCheckout,
  onFriendCode,
  isLoading,
}: PricingCardProps) {
  const handleClick = () => {
    if (tier.ctaAction === "friend_code") {
      onFriendCode();
    } else {
      onCheckout();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg",
        tier.highlighted
          ? "border-action-600 ring-action-600 ring-2"
          : "hover:border-action-300 border-gray-200"
      )}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-action-600 rounded-full px-4 py-1 text-sm font-semibold text-white">
            {tier.badge}
          </span>
        </div>
      )}

      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
          {tier.priceSubtext && (
            <span className="text-sm font-medium text-gray-500">{tier.priceSubtext}</span>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-600">{tier.description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="text-action-600 h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        disabled={isLoading || tier.ctaAction === "subscribe"}
        className={cn(
          "w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors",
          tier.highlighted
            ? "bg-action-600 hover:bg-action-700 disabled:bg-action-400 text-white"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-100",
          tier.ctaAction === "subscribe" && "cursor-not-allowed opacity-60"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
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
            Processing...
          </span>
        ) : (
          tier.ctaText
        )}
      </button>

      {tier.ctaAction === "subscribe" && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Available after completing the 45-Day Challenge
        </p>
      )}
    </div>
  );
}
