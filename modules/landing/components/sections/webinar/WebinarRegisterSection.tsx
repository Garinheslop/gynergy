"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import { WEBINAR_HERO_CONTENT, WEBINAR_SCARCITY_CONTENT } from "../../../data/webinar-content";
import {
  SectionWrapper,
  SectionLabel,
  SectionTitle,
  GoldLine,
  CountdownTimer,
  CTAButton,
} from "../../shared";

interface WebinarRegisterSectionProps {
  onRegister: (email: string, firstName?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function WebinarRegisterSection({
  onRegister,
  isLoading = false,
}: WebinarRegisterSectionProps) {
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
    <SectionWrapper id="register" variant="card" className="py-16 md:py-24">
      <div className="mx-auto max-w-[600px] text-center">
        <SectionLabel centered>Register Now</SectionLabel>
        <SectionTitle centered>
          <span className="text-lp-gold-light">{WEBINAR_SCARCITY_CONTENT.headline}</span>
        </SectionTitle>
        <p className="font-oswald text-lp-gray mb-6 text-base font-extralight">
          {WEBINAR_SCARCITY_CONTENT.subheadline}
        </p>
        <GoldLine variant="center" />

        {/* Countdown */}
        <div className="mt-8 mb-8 flex justify-center">
          <CountdownTimer targetDate={WEBINAR_HERO_CONTENT.eventDate} compact={false} />
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className={cn("bg-lp-card/40 border-lp-border border", "p-6 md:p-8")}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              aria-label="First name (optional)"
              className={cn(
                "flex-1 sm:max-w-[180px]",
                "font-oswald text-sm font-light",
                "px-4 py-3",
                "border-lp-border border bg-[#1a1918]",
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
                "border-lp-border border bg-[#1a1918]",
                "text-lp-white placeholder:text-lp-gray",
                "outline-none",
                "focus:border-lp-gold focus:ring-lp-gold/30 transition-all focus:ring-1"
              )}
            />
          </div>

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
            size="large"
            isLoading={isLoading}
            disabled={!email || isLoading}
            className="w-full"
          >
            Save My Seat
          </CTAButton>

          <p className="font-oswald text-lp-muted mt-4 text-xs font-extralight">
            {WEBINAR_SCARCITY_CONTENT.note}
          </p>
        </form>

        {/* Seats remaining */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="font-oswald text-lp-muted text-sm font-extralight">Only</span>
          <span className="font-bebas text-lp-gold-light text-2xl">
            {WEBINAR_HERO_CONTENT.seatsRemaining}
          </span>
          <span className="font-oswald text-lp-muted text-sm font-extralight">seats remaining</span>
        </div>
      </div>
    </SectionWrapper>
  );
}
