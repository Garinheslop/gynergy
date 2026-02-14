"use client";

import { cn } from "@lib/utils/style";

import { HERO_CONTENT, PILLARS } from "../../data/content";
import type { CTAContent } from "../../types";
import { CountdownTimer, CTAButton } from "../shared";

interface HeroSectionProps {
  cta: CTAContent;
  isLoading?: boolean;
  seatsRemaining?: number;
}

export default function HeroSection({
  cta,
  isLoading = false,
  seatsRemaining = HERO_CONTENT.seatsRemaining,
}: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-20 md:py-24">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 42% at 50% 45%, rgba(184,148,62,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 75% 32% at 50% 55%, rgba(160,130,50,0.05) 0%, transparent 55%),
            radial-gradient(ellipse 68% 62% at 50% 47%, transparent 32%, rgba(0,0,0,0.6) 100%),
            radial-gradient(ellipse 100% 100% at 50% 50%, #0D0C0A 0%, #050505 80%)
          `,
        }}
      />

      {/* Concentric Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[280, 460, 660, 880, 1120].map((size, i) => (
          <div
            key={size}
            className={cn(
              "absolute rounded-full",
              "border-lp-gold/[0.06] border",
              i === 0 && "border-lp-gold/[0.08]",
              i === 3 && "border-lp-gold/[0.04]",
              i === 4 && "border-lp-gold/[0.03]"
            )}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: "0 0 40px 4px rgba(184,148,62,0.015)",
            }}
          />
        ))}
      </div>

      {/* Corner Accents */}
      <div className="absolute top-5 left-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
      </div>
      <div className="absolute top-5 right-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 right-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 right-0 h-px w-full bg-gradient-to-l to-transparent" />
      </div>
      <div className="absolute bottom-5 left-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute bottom-0 left-0 h-full w-px bg-gradient-to-t to-transparent" />
        <div className="from-lp-gold/30 absolute bottom-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
      </div>
      <div className="absolute right-5 bottom-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute right-0 bottom-0 h-full w-px bg-gradient-to-t to-transparent" />
        <div className="from-lp-gold/30 absolute right-0 bottom-0 h-px w-full bg-gradient-to-l to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[900px] text-center">
        {/* Brand */}
        <div className="font-oswald text-lp-gold mb-1 text-sm font-normal tracking-[0.5em] uppercase">
          {HERO_CONTENT.brand}
        </div>
        <div className="font-oswald text-lp-gold/40 mb-4 text-2xl font-extralight">∞</div>

        {/* The */}
        <div className="font-oswald text-lp-white/30 mb-1 text-base font-extralight tracking-[0.5em] uppercase">
          T H E
        </div>

        {/* Main Title */}
        <h1
          className={cn(
            "font-bebas mb-2 leading-[0.85] tracking-wide",
            "text-[clamp(3.5rem,11vw,8rem)]"
          )}
          style={{ textShadow: "0 0 60px rgba(184,148,62,0.06)" }}
        >
          <span
            className="text-lp-gold-light"
            style={{
              textShadow: "0 0 40px rgba(212,168,67,0.18), 0 0 100px rgba(212,168,67,0.06)",
            }}
          >
            45
          </span>
          <span className="text-lp-white">-DAY</span>
          <br />
          <span className="text-lp-white">AWAKENING</span>
        </h1>

        {/* Challenge subtitle */}
        <div
          className={cn(
            "font-bebas text-lp-gold-light tracking-widest",
            "flex items-center justify-center gap-3",
            "text-[clamp(1.5rem,4.5vw,3rem)]"
          )}
          style={{ textShadow: "0 0 30px rgba(212,168,67,0.1)" }}
        >
          <span className="to-lp-gold/45 h-px w-10 bg-gradient-to-r from-transparent" />
          CHALLENGE
          <span className="to-lp-gold/45 h-px w-10 bg-gradient-to-l from-transparent" />
        </div>

        {/* Hook */}
        <p className="font-oswald text-lp-gray mx-auto mt-6 max-w-[600px] text-[clamp(1rem,2vw,1.25rem)] leading-relaxed font-extralight tracking-wide">
          {HERO_CONTENT.hook}
        </p>

        {/* Urgency Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8">
          <CountdownTimer targetDate={HERO_CONTENT.cohortDate} compact />
          <div className="border-lp-gold-dim bg-lp-gold-glow flex flex-col items-center border px-4 py-2">
            <span className="font-bebas text-lp-gold-light text-xl leading-none">
              {seatsRemaining}
            </span>
            <span className="font-oswald text-lp-muted mt-0.5 text-[10px] font-extralight tracking-widest uppercase">
              Seats Left
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <CTAButton
            onClick={cta.action}
            variant={cta.variant === "secondary" ? "secondary" : "primary"}
            size="large"
            isLoading={isLoading}
            disabled={cta.disabled}
          >
            {cta.text}
          </CTAButton>
          <p className="font-oswald text-lp-muted mt-3 text-xs font-extralight tracking-wider">
            Cohort starts{" "}
            {HERO_CONTENT.cohortDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {HERO_CONTENT.totalSeats} seats only
          </p>
        </div>

        {/* Social Proof */}
        <p className="font-oswald text-lp-muted mt-5 text-xs font-extralight tracking-wider">
          <span className="text-lp-gold font-normal">
            {HERO_CONTENT.proof.cohortsCompleted} cohorts completed
          </span>
          {" · "}
          {HERO_CONTENT.proof.daysOfPractice} days of daily practice
          {" · "}
          <span className="text-lp-gold font-normal">{HERO_CONTENT.proof.revenueBuilt} built</span>
        </p>
      </div>

      {/* Bottom Pillars */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-0 whitespace-nowrap lg:flex">
        {PILLARS.map((pillar, i) => (
          <span key={pillar.name} className="flex items-center">
            <span className="font-oswald text-lp-gold/20 text-[11px] font-light tracking-[0.3em] uppercase">
              {pillar.name}
            </span>
            {i < PILLARS.length - 1 && <span className="bg-lp-gold/20 mx-4 h-1 w-1 rounded-full" />}
          </span>
        ))}
      </div>
    </section>
  );
}
