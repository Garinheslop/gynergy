"use client";

import type { CTAContent } from "../../types";
import { SectionWrapper, CTAButton } from "../shared";

interface FinalCTASectionProps {
  cta: CTAContent;
  isLoading?: boolean;
}

export default function FinalCTASection({ cta, isLoading = false }: FinalCTASectionProps) {
  return (
    <SectionWrapper
      className="relative overflow-hidden py-20 md:py-32"
      style={{
        background: "linear-gradient(180deg, var(--color-lp-dark), var(--color-lp-black))",
      }}
    >
      {/* Background rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[350, 600, 900].map((size) => (
          <div
            key={size}
            className="border-lp-gold/[0.04] absolute rounded-full border"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Quote */}
        <p className="font-oswald text-lp-gray mx-auto mb-10 max-w-[560px] text-lg leading-relaxed font-extralight italic md:text-xl">
          &ldquo;The best time to plant a tree was 20 years ago.
          <br />
          The second best time is now.&rdquo;
        </p>

        {/* Math */}
        <div className="font-bebas text-lp-white mb-2 text-2xl tracking-wide md:text-3xl">
          <span className="text-lp-gold-light">45 days</span> × 10 minutes ={" "}
          <span className="text-lp-gold-light">7.5 hours</span>
        </div>
        <p className="font-oswald text-lp-muted mb-8 text-sm font-extralight">
          That&apos;s all it takes to rewire a decade of disconnection.
        </p>

        {/* CTA */}
        <CTAButton
          onClick={cta.action}
          variant={cta.variant === "secondary" ? "secondary" : "primary"}
          size="large"
          isLoading={isLoading}
          disabled={cta.disabled}
        >
          {cta.text}
        </CTAButton>
      </div>
    </SectionWrapper>
  );
}
