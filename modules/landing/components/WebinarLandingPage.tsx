"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import dynamic from "next/dynamic";

import toast from "react-hot-toast";

import { cn } from "@lib/utils/style";
import { SectionErrorBoundary } from "@modules/common/components/ErrorBoundary";

import { LandingNav, ExitIntentPopup } from "./shared";
import { WEBINAR_HERO_CONTENT } from "../data/webinar-content";
import { useExitIntent } from "../hooks/useExitIntent";
import { WebinarHeroSection } from "./sections/webinar";

interface SeatsData {
  seatsRemaining: number;
  isAlmostFull: boolean;
  isFull: boolean;
}

// Dynamic imports for below-fold sections
const WebinarLearnSection = dynamic(() => import("./sections/webinar/WebinarLearnSection"), {
  ssr: true,
});
const WebinarValueStackSection = dynamic(
  () => import("./sections/webinar/WebinarValueStackSection"),
  { ssr: true }
);
const WebinarProofSection = dynamic(() => import("./sections/webinar/WebinarProofSection"), {
  ssr: true,
});
const WebinarBonusSection = dynamic(() => import("./sections/webinar/WebinarBonusSection"), {
  ssr: true,
});
const WebinarRegisterSection = dynamic(() => import("./sections/webinar/WebinarRegisterSection"), {
  ssr: true,
});
const WebinarFinalCTASection = dynamic(() => import("./sections/webinar/WebinarFinalCTASection"), {
  ssr: true,
});

function WebinarLandingPageContent() {
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [seatsData, setSeatsData] = useState<SeatsData>({
    seatsRemaining: WEBINAR_HERO_CONTENT.seatsRemaining,
    isAlmostFull: false,
    isFull: false,
  });
  const { showPopup, closePopup } = useExitIntent({ threshold: 0, delay: 100 });

  // Fetch dynamic seat count on mount
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch("/api/webinar/seats");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSeatsData({
              seatsRemaining: data.data.seatsRemaining,
              isAlmostFull: data.data.isAlmostFull,
              isFull: data.data.isFull,
            });
          }
        }
      } catch {
        // Silently fail - use default values
      }
    };

    fetchSeats();
    // Refresh every 30 seconds for real-time urgency
    const interval = setInterval(fetchSeats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = useCallback(async (email: string, firstName?: string) => {
    setRegistrationLoading(true);
    try {
      const response = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          webinarDate: WEBINAR_HERO_CONTENT.eventDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.alreadyRegistered) {
        toast.success("You're already registered! Check your inbox for the confirmation email.");
      } else {
        toast.success(
          "Seat saved! Confirmation email sent — check your inbox for calendar details."
        );
      }

      // Redirect to assessment
      globalThis.location.href = "/assessment";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(message);
      setRegistrationLoading(false);
    }
  }, []);

  const handleScrollToRegister = useCallback(() => {
    const registerSection = document.getElementById("register");
    if (registerSection) {
      registerSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className={cn("bg-lp-dark text-lp-white font-oswald", "min-h-screen overflow-x-hidden")}>
      {/* Skip to registration link */}
      <a
        href="#register"
        className={cn(
          "sr-only focus:not-sr-only",
          "z-fixed fixed top-4 left-4",
          "bg-lp-gold text-lp-black",
          "font-oswald px-4 py-2 text-sm font-medium",
          "focus:ring-lp-gold-light focus:ring-2 focus:outline-none"
        )}
      >
        Skip to registration
      </a>

      {/* Navigation */}
      <LandingNav
        seatsRemaining={seatsData.seatsRemaining}
        onEnrollClick={handleScrollToRegister}
        isLoading={registrationLoading}
      />

      {/* Hero Section - Critical */}
      <WebinarHeroSection
        onRegister={handleRegister}
        isLoading={registrationLoading}
        seatsRemaining={seatsData.seatsRemaining}
        isAlmostFull={seatsData.isAlmostFull}
      />

      {/* What You'll Learn */}
      <SectionErrorBoundary sectionName="What You'll Learn">
        <WebinarLearnSection />
      </SectionErrorBoundary>

      {/* Value Stack - What You Get */}
      <SectionErrorBoundary sectionName="Value Stack">
        <WebinarValueStackSection />
      </SectionErrorBoundary>

      {/* Social Proof - Testimonials */}
      <SectionErrorBoundary sectionName="Social Proof">
        <WebinarProofSection />
      </SectionErrorBoundary>

      {/* Assessment Bonus Section */}
      <SectionErrorBoundary sectionName="Instant Bonus">
        <WebinarBonusSection />
      </SectionErrorBoundary>

      {/* Registration Form */}
      <SectionErrorBoundary sectionName="Registration">
        <WebinarRegisterSection
          onRegister={handleRegister}
          isLoading={registrationLoading}
          seatsRemaining={seatsData.seatsRemaining}
        />
      </SectionErrorBoundary>

      {/* Final CTA */}
      <SectionErrorBoundary sectionName="Final CTA">
        <WebinarFinalCTASection
          onRegister={handleRegister}
          isLoading={registrationLoading}
          seatsRemaining={seatsData.seatsRemaining}
        />
      </SectionErrorBoundary>

      {/* Footer */}
      <footer className="border-lp-border border-t py-10 text-center">
        <p className="font-oswald text-lp-muted text-xs font-extralight tracking-widest uppercase">
          © {new Date().getFullYear()} Gynergy. All rights reserved.
        </p>
      </footer>

      {/* Exit Intent Popup - Webinar variant */}
      <ExitIntentPopup
        variant="webinar"
        isOpen={showPopup}
        onClose={closePopup}
        onSubmit={async (email) => {
          await handleRegister(email);
        }}
        redirectOnSubmit="/assessment"
      />
    </div>
  );
}

export default function WebinarLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-lp-dark flex min-h-screen items-center justify-center">
          <div className="border-lp-gold h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <WebinarLandingPageContent />
    </Suspense>
  );
}
