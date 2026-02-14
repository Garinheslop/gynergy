"use client";

import { cn } from "@lib/utils/style";

import { WEBINAR_LEARN_CONTENT } from "../../../data/webinar-content";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../../shared";

export default function WebinarLearnSection() {
  return (
    <SectionWrapper variant="dark" className="py-16 md:py-24">
      <div className="text-center">
        <SectionLabel centered>{WEBINAR_LEARN_CONTENT.label}</SectionLabel>
        <SectionTitle centered>
          Leave With <span className="text-lp-gold-light">Actionable Tools</span> &mdash; Not Just
          Ideas
        </SectionTitle>
        <p className="font-oswald text-lp-gray mx-auto mb-6 max-w-[600px] text-base font-extralight">
          This isn&apos;t a motivational speech. You&apos;ll walk away with the exact templates and
          frameworks I use every single day.
        </p>
        <GoldLine variant="center" />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
        {WEBINAR_LEARN_CONTENT.items.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              "relative",
              "bg-lp-card border-lp-border border",
              "p-6 md:p-8",
              "text-center",
              "group"
            )}
          >
            {/* Number badge */}
            <div className="font-bebas text-lp-gold/20 mb-4 text-5xl">
              {String(index + 1).padStart(2, "0")}
            </div>

            <h3 className="font-bebas text-lp-white mb-3 text-xl md:text-2xl">{item.title}</h3>

            <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight">
              {item.description}
            </p>

            {/* Takeaway badge for first item */}
            {index === 0 && (
              <div className="bg-lp-gold/10 border-lp-gold/30 mt-4 inline-block border px-3 py-1">
                <span className="font-oswald text-lp-gold-light text-xs font-medium tracking-wider uppercase">
                  You Get The Template
                </span>
              </div>
            )}

            {/* Gold accent on hover */}
            <div
              className={cn(
                "absolute right-0 bottom-0 left-0 h-[2px]",
                "via-lp-gold/40 bg-gradient-to-r from-transparent to-transparent",
                "opacity-0 transition-opacity duration-300",
                "group-hover:opacity-100"
              )}
            />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
