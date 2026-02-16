"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import {
  WEBINAR_HERO_CONTENT,
  WEBINAR_DREAM_OUTCOME,
  WEBINAR_TESTIMONIALS,
} from "../../../data/webinar-content";
import { CountdownTimer, CTAButton, WebinarVideo } from "../../shared";

// Quote icon SVG
function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
    </svg>
  );
}

interface WebinarHeroSectionProps {
  onRegister: (email: string, firstName?: string) => Promise<void>;
  isLoading?: boolean;
  seatsRemaining?: number;
  isAlmostFull?: boolean;
}

export default function WebinarHeroSection({
  onRegister,
  isLoading = false,
  seatsRemaining = WEBINAR_HERO_CONTENT.seatsRemaining,
  isAlmostFull = false,
}: WebinarHeroSectionProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    // Honeypot check
    if (honeypot) return;

    await onRegister(email, firstName || undefined);
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 md:py-24">
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

      {/* Corner Accents */}
      <div className="absolute top-5 left-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
      </div>
      <div className="absolute top-5 right-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 right-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 right-0 h-px w-full bg-gradient-to-l to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1000px] text-center">
        {/* Brand */}
        <div className="font-oswald text-lp-gold mb-1 text-sm font-normal tracking-[0.5em] uppercase">
          {WEBINAR_HERO_CONTENT.brand}
        </div>
        <div className="font-oswald text-lp-gold/40 mb-4 text-2xl font-extralight">&infin;</div>

        {/* Event Label */}
        <div className="font-oswald text-lp-gold-light mb-2 text-xs font-normal tracking-[0.4em] uppercase">
          {WEBINAR_HERO_CONTENT.eventSubtitle}
        </div>

        {/* Event Title */}
        <h1
          className={cn(
            "font-bebas mb-4 leading-[0.9] tracking-wide",
            "text-[clamp(2rem,6vw,4rem)]"
          )}
          style={{ textShadow: "0 0 60px rgba(184,148,62,0.06)" }}
        >
          <span className="text-lp-gold-light">{WEBINAR_HERO_CONTENT.eventTitle}</span>
        </h1>

        {/* Headline */}
        <h2
          className={cn(
            "font-bebas text-lp-white mb-2 leading-tight tracking-wide",
            "text-[clamp(1.5rem,4vw,2.5rem)]"
          )}
        >
          {WEBINAR_HERO_CONTENT.headline}
        </h2>

        {/* Subheadline - Now leads with 10-minute practice */}
        <p className="font-oswald text-lp-gray mx-auto mb-6 max-w-[700px] text-lg font-extralight">
          {WEBINAR_HERO_CONTENT.subheadline}
        </p>

        {/* Presenter */}
        <p className="font-oswald text-lp-muted mb-8 text-sm font-light tracking-wider">
          {WEBINAR_HERO_CONTENT.presenter}
        </p>

        {/* Video */}
        <div className="mb-8">
          <WebinarVideo
            videoId={WEBINAR_HERO_CONTENT.videoId}
            platform={WEBINAR_HERO_CONTENT.videoPlatform}
            className="border-lp-gold/30 border"
          />
        </div>

        {/* Hero Testimonial - Social Proof Above Fold */}
        <div className="relative mx-auto mb-8 max-w-[600px]">
          <QuoteIcon className="text-lp-gold/20 absolute -top-2 -left-2 h-8 w-8" />
          <blockquote className="px-4">
            <p className="font-oswald text-lp-white text-base leading-relaxed font-light italic md:text-lg">
              &ldquo;{WEBINAR_TESTIMONIALS[0].quote}&rdquo;
            </p>
            <footer className="mt-3 flex items-center justify-center gap-2">
              <span className="font-oswald text-lp-gold-light text-sm font-medium">
                {WEBINAR_TESTIMONIALS[0].author}
              </span>
              <span className="text-lp-muted">&mdash;</span>
              <span className="font-oswald text-lp-muted text-sm font-extralight">
                {WEBINAR_TESTIMONIALS[0].role}
              </span>
            </footer>
            {WEBINAR_TESTIMONIALS[0].result && (
              <div className="mt-2 inline-block">
                <span className="font-oswald bg-lp-gold/10 text-lp-gold-light border-lp-gold/30 border px-3 py-1 text-xs font-medium tracking-wide">
                  {WEBINAR_TESTIMONIALS[0].result}
                </span>
              </div>
            )}
          </blockquote>
        </div>

        {/* Dream Outcome Bullets - Quick callout */}
        <div className="bg-lp-card/50 border-lp-border mb-8 inline-block border px-6 py-4">
          <p className="font-oswald text-lp-gold-light mb-2 text-xs font-medium tracking-wider uppercase">
            {WEBINAR_DREAM_OUTCOME.subheadline}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {WEBINAR_DREAM_OUTCOME.outcomes.slice(0, 3).map((outcome) => (
              <span key={outcome} className="font-oswald text-lp-white text-sm font-extralight">
                &bull; {outcome}
              </span>
            ))}
          </div>
        </div>

        {/* Urgency Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 md:gap-8">
          <CountdownTimer targetDate={WEBINAR_HERO_CONTENT.eventDate} compact />
          <div
            className={cn(
              "flex flex-col items-center border px-4 py-2",
              isAlmostFull
                ? "animate-pulse border-red-500/50 bg-red-500/10"
                : "border-lp-gold-dim bg-lp-gold-glow"
            )}
          >
            <span
              className={cn(
                "font-bebas text-xl leading-none",
                isAlmostFull ? "text-red-400" : "text-lp-gold-light"
              )}
            >
              {seatsRemaining}
            </span>
            <span
              className={cn(
                "font-oswald mt-0.5 text-[10px] font-extralight tracking-widest uppercase",
                isAlmostFull ? "text-red-300" : "text-lp-muted"
              )}
            >
              {isAlmostFull ? "Almost Full!" : "Seats Left"}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-lp-card/30 border-lp-border/50 mx-auto flex max-w-[500px] flex-col gap-3 border p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              aria-label="First name (optional)"
              className={cn(
                "flex-1 sm:max-w-[160px]",
                "font-oswald text-sm font-light",
                "px-4 py-3",
                "border-lp-border bg-lp-input border",
                "text-lp-white placeholder:text-lp-gray",
                "outline-none",
                "focus:border-lp-gold focus:ring-lp-gold/30 transition-all focus:ring-1"
              )}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              aria-label="Email address"
              className={cn(
                "flex-1",
                "font-oswald text-sm font-light",
                "px-4 py-3",
                "border-lp-border bg-lp-input border",
                "text-lp-white placeholder:text-lp-gray",
                "outline-none",
                "focus:border-lp-gold focus:ring-lp-gold/30 transition-all focus:ring-1"
              )}
            />
          </div>

          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <CTAButton
            type="submit"
            variant="primary"
            size="large"
            isLoading={isLoading}
            disabled={!email || isLoading}
            className="w-full"
          >
            Save My Seat
          </CTAButton>
        </form>

        {/* Immediate bonus callout */}
        <p className="font-oswald text-lp-gold-light mt-4 text-sm font-light">
          + Take the Five Pillar Assessment the moment you register
        </p>
      </div>
    </section>
  );
}
