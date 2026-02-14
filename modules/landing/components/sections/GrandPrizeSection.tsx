"use client";

import { cn } from "@lib/utils/style";

import { GRAND_PRIZE } from "../../data/content";
import { SectionWrapper } from "../shared";

export default function GrandPrizeSection() {
  return (
    <SectionWrapper
      id="prize"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--color-lp-black), var(--color-lp-dark), var(--color-lp-black))",
      }}
    >
      {/* Background glow */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "h-[500px] w-[500px] rounded-full",
          "pointer-events-none"
        )}
        style={{
          background: "radial-gradient(circle, rgba(212,168,67,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Prize Box */}
      <div
        className={cn(
          "relative z-10 mx-auto max-w-[680px]",
          "border-lp-gold border-2",
          "p-8 text-center md:p-12",
          "bg-lp-gold-glow"
        )}
      >
        {/* Label */}
        <div className="font-oswald text-lp-gold mb-3 text-xs font-light tracking-[0.4em] uppercase">
          {GRAND_PRIZE.label}
        </div>

        {/* Amount */}
        <div
          className={cn(
            "font-bebas text-lp-gold-light mb-2 leading-none",
            "text-[clamp(2.8rem,7vw,4.5rem)]"
          )}
          style={{ textShadow: "0 0 40px rgba(212,168,67,0.12)" }}
        >
          {GRAND_PRIZE.amount}
        </div>

        {/* Prize Name */}
        <div className="font-bebas text-lp-white mb-5 text-2xl tracking-wide">
          {GRAND_PRIZE.name}
        </div>

        {/* Description */}
        <p className="font-oswald text-lp-gray mx-auto mb-8 max-w-[500px] text-sm leading-relaxed font-extralight">
          {GRAND_PRIZE.description}
        </p>

        {/* Scoring Criteria */}
        <div className="mt-8">
          {GRAND_PRIZE.scoringCriteria.map((criterion, i) => (
            <div
              key={criterion.name}
              className={cn(
                "flex items-center justify-between py-3",
                "font-oswald text-lp-gray text-sm font-light",
                i < GRAND_PRIZE.scoringCriteria.length - 1 && "border-lp-border border-b"
              )}
            >
              <span>{criterion.name}</span>
              <span className="text-lp-gold-light min-w-[45px] text-right font-medium">
                {criterion.percentage}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
