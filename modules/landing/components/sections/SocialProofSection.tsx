"use client";

import { cn } from "@lib/utils/style";

import { TESTIMONIALS } from "../../data/testimonials";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function SocialProofSection() {
  return (
    <SectionWrapper id="proof" variant="dark">
      <div className="text-center">
        <SectionLabel centered>From The Brotherhood</SectionLabel>

        <SectionTitle centered>
          Men who did the work.
          <br />
          <span className="text-lp-gold-light">In their own words.</span>
        </SectionTitle>

        <GoldLine variant="center" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <div key={testimonial.id} className="bg-lp-card border-lp-border relative border p-6">
            {/* Quote mark */}
            <div className="font-bebas text-lp-gold absolute top-4 right-5 text-5xl leading-none opacity-15">
              &ldquo;
            </div>

            {/* Quote */}
            <p className="font-oswald text-lp-gray mb-6 pr-8 text-sm leading-relaxed font-extralight italic">
              {testimonial.quote}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-full",
                  "from-lp-gold/20 to-lp-gold/5 bg-gradient-to-br",
                  "border-lp-gold-dim border",
                  "flex items-center justify-center",
                  "font-oswald text-lp-gold text-xs font-normal tracking-wider"
                )}
              >
                {testimonial.initials}
              </div>
              <div>
                <div className="font-oswald text-lp-white text-sm font-normal tracking-wider">
                  {testimonial.name}
                </div>
                <div className="font-oswald text-lp-muted text-xs font-extralight tracking-wider">
                  {testimonial.role}
                </div>
              </div>
            </div>

            {/* Pillar Changes */}
            <div className="mt-4 flex flex-wrap gap-2">
              {testimonial.pillarChanges.map((change) => (
                <span
                  key={change.pillar}
                  className={cn(
                    "font-oswald text-[10px] font-light tracking-wider uppercase",
                    "px-2 py-1",
                    "border-lp-gold-dim text-lp-gold border"
                  )}
                >
                  {change.pillar}: {change.before} → {change.after}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
