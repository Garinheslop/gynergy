"use client";

import { cn } from "@lib/utils/style";

import { PILLARS } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function FivePillarsSection() {
  return (
    <SectionWrapper id="pillars" variant="dark">
      <div className="text-center">
        <SectionLabel centered>The Framework</SectionLabel>

        <SectionTitle centered>
          Master all five.
          <br />
          <span className="text-lp-gold-light">Not just the one that pays the bills.</span>
        </SectionTitle>

        <GoldLine variant="center" />
      </div>

      {/* Pillars Grid */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.name}
            className={cn(
              "bg-lp-card border-lp-border border",
              "px-4 py-6 text-center",
              "relative overflow-hidden",
              "transition-all duration-400",
              "hover:border-lp-gold/20 hover:-translate-y-1",
              "group"
            )}
          >
            {/* Top gold line on hover */}
            <div
              className={cn(
                "absolute top-0 right-0 left-0 h-0.5",
                "via-lp-gold bg-gradient-to-r from-transparent to-transparent",
                "opacity-0 transition-opacity duration-400",
                "group-hover:opacity-100"
              )}
            />

            {/* Number */}
            <div className="font-bebas text-lp-gold-light mb-2 text-3xl opacity-25">
              {pillar.number}
            </div>

            {/* Name */}
            <h3 className="font-oswald text-lp-white mb-1 text-sm font-medium tracking-widest uppercase">
              {pillar.name}
            </h3>

            {/* Description */}
            <p className="font-oswald text-lp-muted text-xs leading-relaxed font-extralight tracking-wider">
              {pillar.description}
            </p>

            {/* Question */}
            <p className="font-oswald text-lp-gold mt-3 text-xs font-light italic opacity-65">
              {pillar.question}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
