"use client";

import { cn } from "@lib/utils/style";

import { PRICING_CONTENT } from "../../data/content";
import type { CTAContent } from "../../types";
import { SectionWrapper, SectionLabel, SectionTitle, CTAButton } from "../shared";

interface PricingSectionProps {
  cta: CTAContent;
  isLoading?: boolean;
}

export default function PricingSection({ cta, isLoading = false }: PricingSectionProps) {
  return (
    <SectionWrapper id="pricing">
      <div className="text-center">
        <SectionLabel centered>Investment</SectionLabel>

        <SectionTitle centered>
          Everything you need.
          <br />
          <span className="text-lp-gold-light">One investment.</span>
        </SectionTitle>
      </div>

      {/* Pricing Box */}
      <div
        className={cn(
          "mx-auto mt-10 max-w-[680px]",
          "border-lp-gold bg-lp-card border-2",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="bg-lp-gold px-6 py-4 text-center">
          <span className="font-oswald text-lp-black text-sm font-medium tracking-[0.28em] uppercase">
            The 45-Day Awakening Challenge
          </span>
        </div>

        {/* Body */}
        <div className="p-6 md:p-10">
          {/* Stack Items */}
          {PRICING_CONTENT.stackItems.map((item, i) => (
            <div
              key={item.name}
              className={cn(
                "flex items-center justify-between py-3",
                "font-oswald text-lp-gray text-sm font-light",
                i < PRICING_CONTENT.stackItems.length - 1 && "border-lp-border border-b"
              )}
            >
              <span>{item.name}</span>
              <span className="text-lp-gold-light font-normal whitespace-nowrap">{item.value}</span>
            </div>
          ))}

          {/* Total */}
          <div
            className={cn(
              "mt-3 flex items-center justify-between py-5",
              "border-lp-gold border-t-2",
              "font-oswald text-lp-white text-base font-medium"
            )}
          >
            <span>Total Value</span>
            <span className="text-lp-gold-light text-lg">{PRICING_CONTENT.totalValue}</span>
          </div>

          {/* Early Bird Bonus */}
          {PRICING_CONTENT.earlyBirdBonus && (
            <div
              className={cn("my-6 p-5", "border-lp-gold-dim bg-lp-gold-glow border", "text-center")}
            >
              <div className="font-oswald text-lp-gold mb-1 text-xs font-medium tracking-widest uppercase">
                {PRICING_CONTENT.earlyBirdBonus.title}
              </div>
              <div className="font-oswald text-lp-gray text-sm font-extralight">
                {PRICING_CONTENT.earlyBirdBonus.description}
              </div>
            </div>
          )}

          {/* Price Anchor */}
          <div className="py-6 text-center">
            <div className="font-oswald text-lp-muted mb-2 text-base font-light line-through">
              {PRICING_CONTENT.wasPrice}
            </div>

            <div
              className="font-bebas text-lp-gold-light text-6xl leading-none"
              style={{ textShadow: "0 0 30px rgba(212,168,67,0.1)" }}
            >
              {PRICING_CONTENT.nowPrice}
            </div>
            <div className="font-oswald text-lp-muted mt-2 text-sm font-extralight tracking-wide">
              {PRICING_CONTENT.priceNote}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 pb-2 text-center">
            <CTAButton
              onClick={cta.action}
              variant={cta.variant === "secondary" ? "secondary" : "primary"}
              size="large"
              isLoading={isLoading}
              disabled={cta.disabled}
              className="w-full md:w-auto"
            >
              {cta.text}
            </CTAButton>
          </div>

          {/* Trust Indicators */}
          <div className="border-lp-border mt-4 flex items-center justify-center gap-4 border-t pt-4">
            <div className="text-lp-muted flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="font-oswald text-xs font-light tracking-wide">Secure Checkout</span>
            </div>
            <div className="bg-lp-border h-4 w-px" />
            <div className="text-lp-muted flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="font-oswald text-xs font-light tracking-wide">14-Day Guarantee</span>
            </div>
            <div className="bg-lp-border hidden h-4 w-px sm:block" />
            <div className="text-lp-muted hidden items-center gap-1.5 sm:flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="font-oswald text-xs font-light tracking-wide">Stripe Powered</span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
