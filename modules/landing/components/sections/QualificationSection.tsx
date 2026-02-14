"use client";

import { cn } from "@lib/utils/style";

import { QUALIFICATION } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function QualificationSection() {
  return (
    <SectionWrapper id="qualify">
      <div className="text-center">
        <SectionLabel centered>Before You Apply</SectionLabel>

        <SectionTitle centered>
          This is not for everyone.
          <br />
          <span className="text-lp-gold-light">It&apos;s for a very specific man.</span>
        </SectionTitle>

        <GoldLine variant="center" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* For You */}
        <div className={cn("bg-lp-card border-lp-gold/20 border p-8")}>
          <h3 className="font-oswald text-lp-gold-light mb-6 flex items-center gap-2 text-sm font-medium tracking-widest uppercase">
            <span>✦</span> This is for you if
          </h3>

          <ul className="space-y-0">
            {QUALIFICATION.forYou.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "font-oswald text-lp-gray text-sm leading-relaxed font-extralight",
                  "flex items-start gap-3 py-4",
                  i < QUALIFICATION.forYou.length - 1 && "border-lp-white/5 border-b"
                )}
              >
                <span className="text-lp-gold-light mt-0.5 flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Not For You */}
        <div className={cn("bg-lp-card border-lp-white/10 border p-8")}>
          <h3 className="font-oswald text-lp-muted mb-6 flex items-center gap-2 text-sm font-medium tracking-widest uppercase">
            <span>✕</span> This is not for you if
          </h3>

          <ul className="space-y-0">
            {QUALIFICATION.notForYou.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "font-oswald text-lp-gray text-sm leading-relaxed font-extralight",
                  "flex items-start gap-3 py-4",
                  i < QUALIFICATION.notForYou.length - 1 && "border-lp-white/5 border-b"
                )}
              >
                <span className="text-lp-white/25 mt-0.5 flex-shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
