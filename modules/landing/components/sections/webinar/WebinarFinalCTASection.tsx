"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import {
  WEBINAR_HERO_CONTENT,
  WEBINAR_FINAL_CTA,
  WEBINAR_OBJECTIONS,
} from "../../../data/webinar-content";
import { SectionWrapper, CTAButton, CountdownTimer } from "../../shared";

interface WebinarFinalCTASectionProps {
  onRegister: (email: string, firstName?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function WebinarFinalCTASection({
  onRegister,
  isLoading = false,
}: WebinarFinalCTASectionProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    // Honeypot check
    if (honeypot) return;

    await onRegister(email);
  };

  const formattedDate = WEBINAR_HERO_CONTENT.eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = WEBINAR_HERO_CONTENT.eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <SectionWrapper variant="dark" className="py-16 md:py-24">
      <div className="mx-auto max-w-[800px]">
        {/* Final push headline */}
        <div className="mb-10 text-center">
          <h2 className="font-bebas text-lp-white mb-4 text-3xl md:text-4xl lg:text-5xl">
            <span className="text-lp-gold-light">Your Score Is Waiting.</span> Your Seat Is Not.
          </h2>

          <p className="font-oswald text-lp-gray mx-auto max-w-[600px] text-base leading-relaxed font-extralight md:text-lg">
            {WEBINAR_FINAL_CTA.subheadline}
          </p>
        </div>

        {/* Objection Busters */}
        <div className="mb-10 grid gap-3 md:grid-cols-2">
          {WEBINAR_OBJECTIONS.map((item) => (
            <div key={item.objection} className="bg-lp-card/50 border-lp-border border p-4">
              <p className="font-oswald text-lp-muted mb-1 text-xs font-extralight italic">
                &ldquo;{item.objection}&rdquo;
              </p>
              <p className="font-oswald text-lp-white text-sm font-light">{item.response}</p>
            </div>
          ))}
        </div>

        {/* Urgency + Form Box */}
        <div className="bg-lp-card/30 border-lp-gold/30 mx-auto max-w-[550px] border p-6 md:p-8">
          {/* Urgency text */}
          <p className="font-oswald text-lp-white mb-6 text-center text-sm leading-relaxed font-light">
            {WEBINAR_FINAL_CTA.urgency}
          </p>

          {/* Countdown + Event details */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
            <CountdownTimer targetDate={WEBINAR_HERO_CONTENT.eventDate} compact />
            <div className="text-center">
              <p className="font-oswald text-lp-gold-light text-xs font-medium tracking-wider uppercase">
                {WEBINAR_HERO_CONTENT.eventTitle}
              </p>
              <p className="font-oswald text-lp-white text-sm">
                {formattedDate} @ {formattedTime}
              </p>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
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
                "border-lp-border border bg-[#1a1918]",
                "text-lp-white placeholder:text-lp-gray",
                "outline-none",
                "focus:border-lp-gold focus:ring-lp-gold/30 transition-all focus:ring-1"
              )}
            />

            {/* Honeypot field */}
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
              size="default"
              isLoading={isLoading}
              disabled={!email || isLoading}
            >
              Claim My Free Seat
            </CTAButton>
          </form>

          {/* Seats remaining */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="font-oswald text-lp-muted text-sm font-extralight">Only</span>
            <span className="font-bebas text-lp-gold-light text-2xl">
              {WEBINAR_HERO_CONTENT.seatsRemaining}
            </span>
            <span className="font-oswald text-lp-muted text-sm font-extralight">
              of {WEBINAR_HERO_CONTENT.seatsTotal} seats left
            </span>
          </div>
        </div>

        {/* Guarantee - Now prominent */}
        <div className="mt-8 text-center">
          <div className="bg-lp-gold/5 border-lp-gold/20 inline-block border px-6 py-4">
            <p className="font-oswald text-lp-gold-light text-xs font-medium tracking-wider uppercase">
              The Guarantee
            </p>
            <p className="font-oswald text-lp-white mt-2 max-w-[400px] text-sm leading-relaxed font-light">
              {WEBINAR_FINAL_CTA.guarantee}
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
