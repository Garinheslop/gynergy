"use client";

import { cn } from "@lib/utils/style";

import { VALUE_STACK } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function WhatsIncludedSection() {
  return (
    <SectionWrapper id="included">
      <SectionLabel>What You Get</SectionLabel>

      <SectionTitle>
        45 days of engineered transformation.
        <br />
        <span className="text-lp-gold-light">10 minutes a day.</span>
      </SectionTitle>

      <GoldLine variant="left" />

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {VALUE_STACK.map((item) => (
          <div
            key={item.name}
            className={cn(
              "bg-lp-card border-lp-border border p-6",
              "transition-all duration-300",
              "hover:border-lp-gold/15"
            )}
          >
            {/* Icon/Number */}
            <div className="font-bebas text-lp-gold-light mb-3 text-4xl opacity-35">
              {item.icon}
            </div>

            {/* Name */}
            <h3 className="font-oswald text-lp-white mb-3 text-sm font-medium tracking-wider uppercase">
              {item.name}
            </h3>

            {/* Description */}
            <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight">
              {item.description}
            </p>

            {/* Value */}
            <p className="font-oswald text-lp-gold mt-4 text-xs font-normal tracking-wider opacity-55">
              Value: {item.value}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
