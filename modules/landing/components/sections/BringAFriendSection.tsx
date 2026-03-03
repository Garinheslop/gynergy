"use client";

import { cn } from "@lib/utils/style";

import { REFERRAL_CONTENT } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle } from "../shared";

export default function BringAFriendSection() {
  return (
    <SectionWrapper id="friend">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Left: Visual */}
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
          {REFERRAL_CONTENT.circles.map((circle, i) => (
            <div key={circle.label} className="flex items-center gap-4">
              <div
                className={cn(
                  "h-28 w-28 rounded-full md:h-32 md:w-32",
                  "border-lp-gold-dim border",
                  "flex flex-col items-center justify-center",
                  "bg-lp-gold-glow"
                )}
              >
                <span className="font-oswald text-lp-muted text-[10px] font-light tracking-widest uppercase">
                  {circle.label}
                </span>
                <span className="font-bebas text-lp-gold-light text-xl">{circle.price}</span>
              </div>
              {i < REFERRAL_CONTENT.circles.length - 1 && (
                <span className="font-bebas text-lp-gold/25 text-3xl">+</span>
              )}
            </div>
          ))}
        </div>

        {/* Right: Text */}
        <div>
          <SectionLabel>Referral Credits</SectionLabel>

          <SectionTitle>{REFERRAL_CONTENT.headline}</SectionTitle>

          {REFERRAL_CONTENT.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={cn(
                "font-oswald text-lp-gray text-base leading-relaxed font-extralight",
                i < REFERRAL_CONTENT.paragraphs.length - 1 && "mb-5"
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
