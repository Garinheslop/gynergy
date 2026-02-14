"use client";

import { cn } from "@lib/utils/style";

import { TIMELINE } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function TimelineSection() {
  return (
    <SectionWrapper id="timeline" variant="dark">
      <div className="text-center">
        <SectionLabel centered>The Journey</SectionLabel>

        <SectionTitle centered>
          8 calls. 5 pillars. 45 days.
          <br />
          <span className="text-lp-gold-light">Here&apos;s exactly what happens.</span>
        </SectionTitle>

        <GoldLine variant="center" />
      </div>

      {/* Timeline Track */}
      <div className="relative mt-12">
        {/* Horizontal line - desktop only */}
        <div className="via-lp-gold absolute top-7 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent to-transparent lg:block" />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8 lg:gap-0">
          {TIMELINE.map((item) => (
            <div key={item.week} className={cn("relative px-2 text-center lg:px-3", "group")}>
              {/* Dot */}
              <div
                className={cn(
                  "mx-auto mb-4 h-3 w-3 rounded-full",
                  "border-lp-gold bg-lp-black border-2",
                  "relative z-10",
                  "transition-all duration-300",
                  "group-hover:bg-lp-gold group-hover:shadow-[0_0_12px_rgba(184,148,62,0.3)]",
                  item.isHighlight && "bg-lp-gold shadow-[0_0_15px_rgba(184,148,62,0.4)]"
                )}
              />

              {/* Week Label */}
              <div className="font-oswald text-lp-muted mb-1 text-[10px] font-extralight tracking-widest uppercase">
                {item.week}
              </div>

              {/* Name */}
              <h4
                className={cn(
                  "font-oswald mb-1 text-xs font-medium tracking-wider uppercase",
                  "flex min-h-[2rem] items-center justify-center",
                  item.isHighlight ? "text-lp-gold-light" : "text-lp-white"
                )}
              >
                {item.name}
              </h4>

              {/* Description */}
              <p className="font-oswald text-lp-muted text-[10px] leading-snug font-extralight">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
