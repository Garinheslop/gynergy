"use client";

import { cn } from "@lib/utils/style";

import { ABOUT } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle } from "../shared";

export default function AboutSection() {
  return (
    <SectionWrapper id="about" variant="dark">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
        {/* Left: Photo & Stats */}
        <div className="flex flex-col items-center gap-6">
          {/* Photo Placeholder */}
          <div
            className={cn(
              "h-[280px] w-[220px]",
              "bg-lp-card border-lp-border border",
              "flex items-center justify-center"
            )}
          >
            <span className="font-oswald text-lp-muted px-4 text-center text-xs font-extralight tracking-wider uppercase">
              {ABOUT.photoPlaceholder}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid w-[220px] grid-cols-2 gap-4">
            {ABOUT.stats.map((stat) => (
              <div key={stat.label} className="bg-lp-card border-lp-border border p-4 text-center">
                <div className="font-bebas text-lp-gold-light text-2xl">{stat.value}</div>
                <div className="font-oswald text-lp-muted mt-1 text-[10px] font-extralight tracking-wider uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bio */}
        <div>
          <SectionLabel>Your Guide</SectionLabel>

          <SectionTitle>{ABOUT.name}</SectionTitle>

          {ABOUT.bio.map((paragraph, i) => (
            <p
              key={i}
              className={cn(
                "font-oswald text-lp-gray text-base leading-relaxed font-extralight",
                i < ABOUT.bio.length - 1 && "mb-5"
              )}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
