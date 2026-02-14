"use client";

import { cn } from "@lib/utils/style";

import { WEBINAR_ASSESSMENT_BONUS } from "../../../data/webinar-content";
import { SectionWrapper, GoldLine } from "../../shared";

export default function WebinarBonusSection() {
  return (
    <SectionWrapper variant="card" className="py-16 md:py-24">
      <div className="mx-auto max-w-[800px]">
        {/* Bonus Badge */}
        <div className="mb-6 text-center">
          <span className="bg-lp-gold text-lp-black font-oswald inline-block px-4 py-1 text-xs font-medium tracking-widest uppercase">
            {WEBINAR_ASSESSMENT_BONUS.headline}
          </span>
        </div>

        {/* Two Column Layout */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left - Content */}
          <div>
            <h2 className="font-bebas text-lp-white mb-2 text-3xl md:text-4xl">
              {WEBINAR_ASSESSMENT_BONUS.title}
            </h2>
            <p className="font-oswald text-lp-gold-light mb-4 text-sm font-medium tracking-wider">
              {WEBINAR_ASSESSMENT_BONUS.subtitle}
            </p>
            <GoldLine variant="left" />

            <p className="font-oswald text-lp-gray mt-6 text-sm leading-relaxed font-extralight">
              {WEBINAR_ASSESSMENT_BONUS.description}
            </p>

            {/* Features */}
            <ul className="mt-6 space-y-3">
              {WEBINAR_ASSESSMENT_BONUS.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="text-lp-gold mt-1 text-xs">&check;</span>
                  <span className="font-oswald text-lp-white text-sm font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Assessment Preview */}
          <div className="relative">
            <div
              className={cn(
                "bg-lp-dark border-lp-gold/30 border",
                "p-6 md:p-8",
                "relative overflow-hidden"
              )}
            >
              {/* Score Preview */}
              <div className="mb-6 text-center">
                <p className="font-oswald text-lp-muted mb-2 text-xs font-extralight tracking-wider uppercase">
                  Your Five Pillar Score
                </p>
                <div
                  className="font-bebas text-lp-gold-light text-7xl"
                  style={{ textShadow: "0 0 40px rgba(212,168,67,0.3)" }}
                >
                  ??
                  <span className="text-lp-white/30 text-3xl">/50</span>
                </div>
              </div>

              {/* Pillar Preview */}
              <div className="space-y-3">
                {["Wealth", "Health", "Relationships", "Growth", "Purpose"].map((pillar) => (
                  <div key={pillar} className="flex items-center gap-3">
                    <span className="font-oswald text-lp-gray w-24 text-xs">{pillar}</span>
                    <div className="bg-lp-border relative h-2 flex-1 overflow-hidden">
                      <div
                        className="bg-lp-gold/40 absolute top-0 left-0 h-full"
                        style={{ width: `${Math.random() * 60 + 20}%` }}
                      />
                    </div>
                    <span className="font-bebas text-lp-gold w-4 text-right text-sm">?</span>
                  </div>
                ))}
              </div>

              {/* Overlay hint */}
              <div className="bg-lp-dark/80 absolute inset-0 flex items-center justify-center">
                <p className="font-oswald text-lp-gold-light text-sm font-medium">
                  {WEBINAR_ASSESSMENT_BONUS.cta}
                </p>
              </div>
            </div>

            {/* Corner decoration */}
            <div className="from-lp-gold to-lp-gold/0 absolute -right-2 -bottom-2 h-16 w-16 bg-gradient-to-tl opacity-20" />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
