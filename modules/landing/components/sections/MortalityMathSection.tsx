"use client";

import { cn } from "@lib/utils/style";

import { MORTALITY_MATH } from "../../data/content";
import { SectionWrapper, SectionLabel, GoldLine } from "../shared";

export default function MortalityMathSection() {
  return (
    <SectionWrapper id="mortality" variant="default" className="relative overflow-hidden">
      {/* Large background number */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "font-bebas text-[clamp(5rem,14vw,11rem)] leading-none",
          "text-lp-gold-light tracking-wide whitespace-nowrap opacity-[0.07]",
          "pointer-events-none select-none"
        )}
      >
        {MORTALITY_MATH.remainingAt40.toLocaleString()}
      </div>

      <div className="relative z-10">
        <SectionLabel>The Math No One Does</SectionLabel>

        <h2
          className={cn(
            "font-bebas text-lp-white mb-6 leading-tight tracking-wide",
            "text-[clamp(1.6rem,3.5vw,2.8rem)]",
            "max-w-[700px]"
          )}
        >
          {MORTALITY_MATH.question}
        </h2>

        <GoldLine variant="left" />

        <p className="font-oswald text-lp-gray mb-6 max-w-[620px] text-base leading-relaxed font-extralight">
          Average lifespan: 80 years. That&apos;s {MORTALITY_MATH.totalHours.toLocaleString()}{" "}
          hours. If you&apos;re 40, you have roughly {MORTALITY_MATH.remainingAt40.toLocaleString()}{" "}
          left. You&apos;ve spent thousands building a life that looks perfect from the outside and
          feels hollow from the inside.
        </p>

        {/* Stat Box */}
        <div className="border-lp-gold-dim bg-lp-gold-glow my-6 inline-flex flex-col items-center border px-10 py-6">
          <span className="font-bebas text-lp-gold-light text-5xl leading-none">
            {MORTALITY_MATH.challengeDays} DAYS
          </span>
          <span className="font-oswald text-lp-muted mt-2 text-xs font-extralight tracking-[0.3em] uppercase">
            = {MORTALITY_MATH.percentOfLife} of your remaining life
          </span>
        </div>

        <p className="font-oswald text-lp-gold/70 mt-6 max-w-[620px] text-sm font-light italic">
          {MORTALITY_MATH.insight}
        </p>
      </div>
    </SectionWrapper>
  );
}
