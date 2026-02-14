"use client";

import { Suspense, useEffect, useState, useCallback } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { useSession } from "@contexts/UseSession";
import { SectionErrorBoundary } from "@modules/common/components/ErrorBoundary";
import { useDispatch, useSelector } from "@store/hooks";
import { createCheckoutSession, fetchEntitlements } from "@store/modules/payment";

// Critical path components - loaded eagerly
import { HeroSection, PricingSection, FinalCTASection } from "./sections";
import { LandingNav, StickyMobileCTA, ExitIntentPopup } from "./shared";
import { HERO_CONTENT } from "../data/content";
import { useExitIntent } from "../hooks/useExitIntent";
import type { CTAContent } from "../types";

// Below-fold sections - loaded dynamically for better initial load performance
const MortalityMathSection = dynamic(() => import("./sections/MortalityMathSection"), {
  ssr: true,
});
const VSLSection = dynamic(() => import("./sections/VSLSection"), {
  ssr: true,
});
const ProblemSection = dynamic(() => import("./sections/ProblemSection"), {
  ssr: true,
});
const FivePillarsSection = dynamic(() => import("./sections/FivePillarsSection"), { ssr: true });
const QualificationSection = dynamic(() => import("./sections/QualificationSection"), {
  ssr: true,
});
const SocialProofSection = dynamic(() => import("./sections/SocialProofSection"), { ssr: true });
const WhatsIncludedSection = dynamic(() => import("./sections/WhatsIncludedSection"), {
  ssr: true,
});
const TimelineSection = dynamic(() => import("./sections/TimelineSection"), {
  ssr: true,
});
const GrandPrizeSection = dynamic(() => import("./sections/GrandPrizeSection"), { ssr: true });
const BringAFriendSection = dynamic(() => import("./sections/BringAFriendSection"), { ssr: true });
const AboutSection = dynamic(() => import("./sections/AboutSection"), {
  ssr: true,
});
const GuaranteeSection = dynamic(() => import("./sections/GuaranteeSection"), { ssr: true });
const FAQSection = dynamic(() => import("./sections/FAQSection"), {
  ssr: true,
});

function AwakeningChallengePageContent() {
  const router = useRouter();
  const { session, authenticating } = useSession();
  const dispatch = useDispatch();

  const payment = useSelector((state) => state.payment);
  const profile = useSelector((state) => state.profile);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  // Exit intent popup
  const { showPopup, closePopup } = useExitIntent({
    threshold: 0,
    delay: 100,
  });

  // Fetch entitlements when logged in
  useEffect(() => {
    if (session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch(fetchEntitlements() as any);
    }
  }, [session, dispatch]);

  // Check access state
  useEffect(() => {
    if (session && !authenticating && !payment.loading) {
      setHasCheckedAccess(true);
      // If has access AND profile is complete, redirect to dashboard
      if (payment.entitlements?.hasChallengeAccess && profile.current?.firstName) {
        router.push("/date-zero-gratitude");
      }
    } else if (!session && !authenticating) {
      setHasCheckedAccess(true);
    }
  }, [session, authenticating, payment.loading, payment.entitlements, profile, router]);

  // Checkout handler
  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckoutSession("challenge");
      globalThis.location.href = checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed. Please try again.";
      toast.error(message);
      setCheckoutLoading(false);
    }
  }, []);

  // Email capture handler for exit intent
  const handleEmailCapture = useCallback(async (email: string) => {
    const response = await fetch("/api/landing/email-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "exit_intent" }),
    });

    if (!response.ok) {
      throw new Error("Failed to capture email");
    }

    toast.success("You're on the list!");
  }, []);

  // Navigate to dashboard (for users with access)
  const handleContinue = useCallback(() => {
    router.push("/date-zero-gratitude");
  }, [router]);

  // Scroll to pricing
  const handleScrollToPricing = useCallback(() => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Get CTA content based on state
  const getCTAContent = useCallback((): CTAContent => {
    if (authenticating || (session && payment.loading)) {
      return {
        text: "Loading...",
        action: () => {},
        disabled: true,
      };
    }

    if (payment.entitlements?.hasChallengeAccess) {
      return {
        text: "Continue Your Journey",
        action: handleContinue,
        variant: "secondary",
      };
    }

    return {
      text: "Claim Your Seat - $997",
      action: handleCheckout,
      variant: "primary",
    };
  }, [
    authenticating,
    session,
    payment.loading,
    payment.entitlements,
    handleCheckout,
    handleContinue,
  ]);

  const ctaContent = getCTAContent();
  const hasChallengeAccess = payment.entitlements?.hasChallengeAccess;

  // Show loading skeleton while checking auth
  if (!hasCheckedAccess) {
    return (
      <div className="bg-lp-dark min-h-screen">
        {/* Skeleton nav */}
        <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-8 py-4">
          <div className="bg-lp-card h-8 w-20 animate-pulse rounded" />
          <div className="bg-lp-card h-10 w-28 animate-pulse rounded" />
        </div>

        {/* Skeleton hero */}
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="bg-lp-card mb-4 h-4 w-32 animate-pulse rounded" />
          <div className="bg-lp-card mb-4 h-20 w-80 animate-pulse rounded" />
          <div className="bg-lp-card mb-8 h-6 w-64 animate-pulse rounded" />
          <div className="bg-lp-gold/20 h-14 w-48 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-lp-dark text-lp-white font-oswald min-h-screen overflow-x-hidden">
      {/* Skip to main content link */}
      <a
        href="#pricing"
        className="bg-lp-gold text-lp-black font-oswald focus:ring-lp-gold-light z-fixed sr-only fixed top-4 left-4 px-4 py-2 text-sm font-medium focus:not-sr-only focus:ring-2 focus:outline-none"
      >
        Skip to pricing
      </a>

      {/* Navigation */}
      <LandingNav
        seatsRemaining={HERO_CONTENT.seatsRemaining}
        onEnrollClick={hasChallengeAccess ? handleContinue : handleScrollToPricing}
        isLoading={checkoutLoading}
      />

      {/* Hero Section - Critical */}
      <HeroSection
        cta={ctaContent}
        isLoading={checkoutLoading}
        seatsRemaining={HERO_CONTENT.seatsRemaining}
      />

      {/* Below-fold sections with error boundaries */}
      <SectionErrorBoundary sectionName="Mortality Math">
        <MortalityMathSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Video">
        <VSLSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Problem">
        <ProblemSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Five Pillars">
        <FivePillarsSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Qualification">
        <QualificationSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Testimonials">
        <SocialProofSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="What's Included">
        <WhatsIncludedSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Timeline">
        <TimelineSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Grand Prize">
        <GrandPrizeSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Bring a Friend">
        <BringAFriendSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="About">
        <AboutSection />
      </SectionErrorBoundary>

      {/* Pricing - Critical */}
      <PricingSection cta={ctaContent} isLoading={checkoutLoading} />

      <SectionErrorBoundary sectionName="Guarantee">
        <GuaranteeSection />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="FAQ">
        <FAQSection />
      </SectionErrorBoundary>

      {/* Final CTA - Critical */}
      <FinalCTASection cta={ctaContent} isLoading={checkoutLoading} />

      {/* Footer */}
      <footer className="border-lp-border border-t py-10 text-center">
        <p className="font-oswald text-lp-muted text-xs font-extralight tracking-widest uppercase">
          © {new Date().getFullYear()} Gynergy. All rights reserved.
        </p>
      </footer>

      {/* Sticky Mobile CTA */}
      {!hasChallengeAccess && (
        <StickyMobileCTA
          ctaText="Claim Your Seat"
          price="$997"
          onCtaClick={handleCheckout}
          isLoading={checkoutLoading}
        />
      )}

      {/* Exit Intent Popup */}
      {!hasChallengeAccess && (
        <ExitIntentPopup isOpen={showPopup} onClose={closePopup} onSubmit={handleEmailCapture} />
      )}
    </div>
  );
}

// Wrap with Suspense for client-side hooks
export default function AwakeningChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-lp-dark flex min-h-screen items-center justify-center">
          <div className="border-lp-gold h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <AwakeningChallengePageContent />
    </Suspense>
  );
}
