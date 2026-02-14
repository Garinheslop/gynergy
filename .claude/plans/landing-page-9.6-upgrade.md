# Landing Page 9.6+ Upgrade Plan

## Current State: 8.5/10

## Target State: 9.6+/10

---

## Executive Summary

This plan addresses 7 key areas to elevate the landing page from 8.5/10 to 9.6+/10:

1. **Code Quality** (9 → 10): Fix 3 ESLint warnings, improve type safety
2. **Integration** (8 → 10): Wire up exit intent, add email capture API, error handling
3. **Accessibility** (7 → 9.5): Skip link, focus management, ARIA enhancements
4. **Performance** (8 → 9.5): Image optimization, dynamic imports, loading states
5. **SEO** (7 → 9.5): Landing-specific metadata, structured data
6. **Error Handling** (7 → 9.5): Error boundaries, graceful degradation, toast notifications
7. **Polish** (8 → 10): VSL video embed, about image, email capture flow

---

## Phase 1: Code Quality & Type Safety (9 → 10)

### 1.1 Fix ESLint Warnings in AwakeningChallengePage.tsx

**File: [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

**Issue 1: Line 65 - `any` type**

```typescript
// BEFORE
dispatch(fetchEntitlements() as any);

// AFTER
dispatch(fetchEntitlements() as unknown as AnyAction);
// OR better - fix at source by typing fetchEntitlements properly
```

**Issue 2: Line 80 - Missing dependency**

```typescript
// Add dispatch to useEffect dependencies array
// Already present - verify the warning is about router
}, [session, authenticating, payment.loading, payment.entitlements, profile.current, router]);
```

**Issue 3: Line 229 - console.log**

```typescript
// BEFORE
onSubmit={async (email) => {
  console.log("Email captured:", email);
}}

// AFTER - integrate with actual API
onSubmit={handleEmailCapture}
```

### 1.2 Fix Type Safety in Payment Actions

**File: [store/modules/payment/index.ts](store/modules/payment/index.ts)**

```typescript
// Add proper typing for thunk action
import type { ThunkAction, AnyAction } from "@reduxjs/toolkit";
import type { RootState } from "@store/configureStore";

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

export const fetchEntitlements = (): AppThunk => async (dispatch) => {
  // ... existing implementation
};
```

---

## Phase 2: Integration Completeness (8 → 10)

### 2.1 Email Capture API Integration

**Create: [app/api/landing/email-capture/route.ts](app/api/landing/email-capture/route.ts)**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

export async function POST(request: Request) {
  const { email, source = "exit_intent" } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createClient();

  const { error } = await supabase.from("landing_leads").insert({
    email,
    source,
    captured_at: new Date().toISOString(),
  });

  if (error?.code === "23505") {
    // Duplicate email - still return success (don't reveal existing emails)
    return NextResponse.json({ success: true });
  }

  if (error) {
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 2.2 Email Capture Handler in AwakeningChallengePage

**Update: [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

```typescript
import toast from "react-hot-toast";

// Add email capture handler
const handleEmailCapture = useCallback(async (email: string) => {
  try {
    const response = await fetch("/api/landing/email-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "exit_intent" }),
    });

    if (!response.ok) throw new Error("Failed to capture email");

    toast.success("You're on the list!");
  } catch (error) {
    toast.error("Something went wrong. Please try again.");
    throw error; // Re-throw so ExitIntentPopup can handle
  }
}, []);
```

### 2.3 Error Handling for Checkout

**Update checkout handler:**

```typescript
const handleCheckout = useCallback(async () => {
  setCheckoutLoading(true);
  try {
    const { checkoutUrl } = await createCheckoutSession("challenge");
    globalThis.location.href = checkoutUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    toast.error(message);
    setCheckoutLoading(false);
  }
}, []);
```

---

## Phase 3: Accessibility Enhancements (7 → 9.5)

### 3.1 Skip to Content Link

**Update: [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

Add at the top of the return statement:

```tsx
{
  /* Skip to main content link */
}
<a
  href="#pricing"
  className={cn(
    "sr-only focus:not-sr-only",
    "fixed top-4 left-4 z-[100]",
    "bg-lp-gold text-lp-black",
    "font-oswald px-4 py-2 text-sm font-medium",
    "focus:ring-lp-gold-light focus:ring-2 focus:outline-none"
  )}
>
  Skip to pricing
</a>;
```

### 3.2 Focus Management in ExitIntentPopup

**Update: [ExitIntentPopup.tsx](modules/landing/components/shared/ExitIntentPopup.tsx)**

```tsx
import { useEffect, useRef } from "react";

export default function ExitIntentPopup({ isOpen, onClose, onSubmit }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus trap and initial focus
  useEffect(() => {
    if (isOpen) {
      emailInputRef.current?.focus();
      // Store previously focused element
      const previouslyFocused = document.activeElement as HTMLElement;

      return () => {
        previouslyFocused?.focus();
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // ... rest of component with ref={emailInputRef} on input
  // and ref={closeButtonRef} on close button
```

### 3.3 ARIA Enhancements for FAQ

**Update: [FAQSection.tsx](modules/landing/components/sections/FAQSection.tsx)**

```tsx
{/* Add proper ARIA IDs */}
<button
  onClick={() => toggleItem(i)}
  className={...}
  aria-expanded={openIndex === i}
  aria-controls={`faq-answer-${i}`}
  id={`faq-question-${i}`}
>

{/* Answer panel */}
<div
  id={`faq-answer-${i}`}
  role="region"
  aria-labelledby={`faq-question-${i}`}
  className={...}
>
```

### 3.4 Button Focus States

**Update: [CTAButton.tsx](modules/landing/components/shared/CTAButton.tsx)**

```tsx
// Add focus-visible styles
className={cn(
  // ... existing styles
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lp-black",
  className
)}
```

---

## Phase 4: Performance Optimization (8 → 9.5)

### 4.1 Image Optimization for About Section

**Update: [AboutSection.tsx](modules/landing/components/sections/AboutSection.tsx)**

```tsx
import Image from "next/image";

// Replace photo placeholder with optimized image
<div className="relative h-[280px] w-[220px]">
  {ABOUT.photoUrl ? (
    <Image
      src={ABOUT.photoUrl}
      alt={`${ABOUT.name} - Your guide for the 45-Day Awakening Challenge`}
      fill
      className="object-cover"
      sizes="220px"
      priority={false}
    />
  ) : (
    <div className="bg-lp-card border-lp-border flex h-full w-full items-center justify-center border">
      <span className="font-oswald text-lp-muted px-4 text-center text-xs font-extralight tracking-wider uppercase">
        {ABOUT.photoPlaceholder}
      </span>
    </div>
  )}
</div>;
```

**Update: [content.ts](modules/landing/data/content.ts)**

```typescript
export const ABOUT: AboutContent = {
  name: "Garin Heslop",
  photoUrl: "/images/garin-headshot.jpg", // Add actual image
  photoPlaceholder: "Photo placeholder",
  // ... rest
};
```

### 4.2 Dynamic Imports for Below-Fold Sections

**Update: [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

```tsx
import dynamic from "next/dynamic";

// Eagerly load critical path (Hero, Pricing, Final CTA)
import { HeroSection, PricingSection, FinalCTASection } from "./sections";

// Lazy load below-fold sections
const MortalityMathSection = dynamic(() => import("./sections/MortalityMathSection"));
const VSLSection = dynamic(() => import("./sections/VSLSection"));
const ProblemSection = dynamic(() => import("./sections/ProblemSection"));
const FivePillarsSection = dynamic(() => import("./sections/FivePillarsSection"));
const QualificationSection = dynamic(() => import("./sections/QualificationSection"));
const SocialProofSection = dynamic(() => import("./sections/SocialProofSection"));
const WhatsIncludedSection = dynamic(() => import("./sections/WhatsIncludedSection"));
const TimelineSection = dynamic(() => import("./sections/TimelineSection"));
const GrandPrizeSection = dynamic(() => import("./sections/GrandPrizeSection"));
const BringAFriendSection = dynamic(() => import("./sections/BringAFriendSection"));
const AboutSection = dynamic(() => import("./sections/AboutSection"));
const GuaranteeSection = dynamic(() => import("./sections/GuaranteeSection"));
const FAQSection = dynamic(() => import("./sections/FAQSection"));
```

### 4.3 VSL Video Component with Lazy Loading

**Update: [VSLSection.tsx](modules/landing/components/sections/VSLSection.tsx)**

```tsx
interface VSLSectionProps {
  videoId?: string; // YouTube or Vimeo ID
  platform?: "youtube" | "vimeo";
}

export default function VSLSection({
  videoId = "YOUR_VIDEO_ID",
  platform = "youtube"
}: VSLSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    setHasInteracted(true);
  };

  const embedUrl = platform === "youtube"
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  return (
    // ... existing wrapper
    {isPlaying && hasInteracted ? (
      <iframe
        src={embedUrl}
        title="The 45-Day Awakening Challenge Explained"
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    ) : (
      // ... existing play button
    )}
  );
}
```

---

## Phase 5: SEO & Metadata (7 → 9.5)

### 5.1 Landing Page Specific Metadata

**Create: [app/(landing)/layout.tsx](<app/(landing)/layout.tsx>)** OR update **[app/page.tsx](app/page.tsx)**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "45-Day Awakening Challenge | Transform Your Life in 45 Days | GYNERGY",
  description:
    "For successful men who built everything and feel nothing. 45 days to fix the multiplier across wealth, health, relationships, growth, and purpose. Limited to 15 seats.",
  keywords: [
    "mens transformation program",
    "45 day challenge",
    "life coaching for men",
    "five pillars of life",
    "executive coaching",
    "mens personal development",
  ],
  openGraph: {
    title: "45-Day Awakening Challenge | GYNERGY",
    description:
      "For successful men who built everything and feel nothing. 45 days to fix the multiplier.",
    url: "https://www.gynergy.app",
    siteName: "GYNERGY",
    images: [
      {
        url: "https://www.gynergy.app/images/og-awakening-challenge.jpg",
        width: 1200,
        height: 630,
        alt: "The 45-Day Awakening Challenge",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "45-Day Awakening Challenge | GYNERGY",
    description:
      "For successful men who built everything and feel nothing. 45 days to fix the multiplier.",
    images: ["https://www.gynergy.app/images/og-awakening-challenge.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.gynergy.app",
  },
};
```

### 5.2 JSON-LD Structured Data

**Add to [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

```tsx
import Script from "next/script";

// Inside component, add structured data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "The 45-Day Awakening Challenge",
  description: "A 45-day transformation program for successful men across five life pillars.",
  provider: {
    "@type": "Organization",
    name: "GYNERGY",
    url: "https://www.gynergy.app",
  },
  offers: {
    "@type": "Offer",
    price: "997",
    priceCurrency: "USD",
    availability: "https://schema.org/LimitedAvailability",
  },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    duration: "P45D",
  },
};

// In return statement, add:
<Script
  id="structured-data"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>;
```

---

## Phase 6: Error Handling & Resilience (7 → 9.5)

### 6.1 Section Error Boundaries

**Update: [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

```tsx
import { SectionErrorBoundary } from "@modules/common/components/ErrorBoundary";

// Wrap each section with error boundary
<SectionErrorBoundary sectionName="Social Proof">
  <SocialProofSection />
</SectionErrorBoundary>

<SectionErrorBoundary sectionName="Timeline">
  <TimelineSection />
</SectionErrorBoundary>

// Critical sections (Hero, Pricing, FinalCTA) can use custom fallbacks
<ErrorBoundary
  fallback={
    <section className="min-h-screen bg-lp-dark flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-bebas text-2xl text-lp-white mb-4">
          Unable to load this section
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="font-oswald text-sm text-lp-gold underline"
        >
          Refresh page
        </button>
      </div>
    </section>
  }
>
  <HeroSection cta={ctaContent} isLoading={checkoutLoading} />
</ErrorBoundary>
```

### 6.2 Landing Page Error Boundary Fallback

**Create: [modules/landing/components/shared/LandingErrorFallback.tsx](modules/landing/components/shared/LandingErrorFallback.tsx)**

```tsx
"use client";

import { cn } from "@lib/utils/style";

interface LandingErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
}

export default function LandingErrorFallback({ error, onReset }: LandingErrorFallbackProps) {
  return (
    <div
      className={cn(
        "bg-lp-dark min-h-screen",
        "flex flex-col items-center justify-center",
        "px-6 py-20"
      )}
    >
      <div className="font-oswald text-lp-gold mb-4 text-sm tracking-[0.5em] uppercase">
        G Y N E R G Y
      </div>

      <h1 className="font-bebas text-lp-white mb-4 text-center text-4xl">Something went wrong</h1>

      <p className="font-oswald text-lp-gray mb-8 max-w-md text-center font-extralight">
        We encountered an issue loading this page. Please try refreshing or contact support if the
        problem persists.
      </p>

      <button
        onClick={onReset || (() => window.location.reload())}
        className={cn(
          "font-oswald text-sm font-medium tracking-widest uppercase",
          "px-8 py-3",
          "bg-lp-gold text-lp-black",
          "hover:bg-lp-gold-light transition-colors"
        )}
      >
        Try Again
      </button>

      {process.env.NODE_ENV === "development" && error && (
        <pre className="bg-lp-card text-lp-muted mt-8 max-w-lg overflow-auto p-4 text-xs">
          {error.message}
        </pre>
      )}
    </div>
  );
}
```

---

## Phase 7: Polish & Final Touches (8 → 10)

### 7.1 Loading Skeleton for Auth State

**Update loading state in [AwakeningChallengePage.tsx](modules/landing/components/AwakeningChallengePage.tsx)**

```tsx
if (!hasCheckedAccess) {
  return (
    <div className="bg-lp-dark min-h-screen">
      {/* Skeleton nav */}
      <div className="fixed top-0 right-0 left-0 flex items-center justify-between px-8 py-4">
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
```

### 7.2 Enhanced Exit Intent Popup States

**Update: [ExitIntentPopup.tsx](modules/landing/components/shared/ExitIntentPopup.tsx)**

```tsx
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || isSubmitting) return;

  setError(null);
  setIsSubmitting(true);

  try {
    await onSubmit?.(email);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail("");
    }, 2000);
  } catch {
    setError("Failed to submit. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

// Add error display in JSX
{
  error && <p className="font-oswald mt-2 text-xs font-light text-red-400">{error}</p>;
}
```

### 7.3 About Section Image Type Update

**Update: [types.ts](modules/landing/types.ts)**

```typescript
export interface AboutContent {
  name: string;
  photoUrl?: string; // Add this
  photoPlaceholder: string;
  stats: {
    value: string;
    label: string;
  }[];
  bio: string[];
}
```

---

## Implementation Order

### Sprint 1: Critical Fixes (Target: +0.5 points)

1. [ ] Fix 3 ESLint warnings in AwakeningChallengePage.tsx
2. [ ] Add proper typing for fetchEntitlements
3. [ ] Add error handling for checkout flow
4. [ ] Wire up email capture with toast notifications

### Sprint 2: Accessibility (Target: +0.4 points)

1. [ ] Add skip-to-content link
2. [ ] Add focus management to ExitIntentPopup
3. [ ] Add Escape key handler to popup
4. [ ] Enhance FAQ with ARIA attributes
5. [ ] Add focus-visible states to all buttons

### Sprint 3: Performance & SEO (Target: +0.4 points)

1. [ ] Implement dynamic imports for below-fold sections
2. [ ] Add Next.js Image optimization
3. [ ] Add landing-specific metadata
4. [ ] Add JSON-LD structured data
5. [ ] Add VSL video embed with lazy loading

### Sprint 4: Resilience & Polish (Target: +0.3 points)

1. [ ] Add SectionErrorBoundary to all sections
2. [ ] Create LandingErrorFallback component
3. [ ] Improve loading skeleton
4. [ ] Add error states to ExitIntentPopup
5. [ ] Create email capture API route

---

## Database Migration (if needed)

```sql
-- Add landing_leads table for email capture
CREATE TABLE IF NOT EXISTS landing_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'exit_intent',
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  metadata JSONB
);

-- RLS policies
ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;

-- Service role can insert
CREATE POLICY "Service role can manage leads"
  ON landing_leads
  FOR ALL
  TO service_role
  USING (true);
```

---

## Verification Checklist

### Code Quality (10/10)

- [ ] Zero ESLint errors
- [ ] Zero ESLint warnings
- [ ] Full TypeScript type coverage
- [ ] No `any` types

### Integration (10/10)

- [ ] Exit intent popup triggers correctly
- [ ] Email capture saves to database
- [ ] Checkout flow works with error handling
- [ ] Toast notifications appear

### Accessibility (9.5/10)

- [ ] Skip link works (Tab from top of page)
- [ ] Popup traps focus correctly
- [ ] Escape closes popup
- [ ] FAQ is keyboard navigable
- [ ] All buttons have focus-visible states

### Performance (9.5/10)

- [ ] Lighthouse Performance > 90
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Images use next/image

### SEO (9.5/10)

- [ ] Open Graph tags present
- [ ] Twitter cards work
- [ ] Structured data validates
- [ ] Canonical URL set

### Error Handling (9.5/10)

- [ ] Sections fail gracefully
- [ ] Checkout errors show toast
- [ ] Email capture errors show inline message
- [ ] Page-level error boundary works

---

## Files to Create/Modify Summary

### Create:

1. `app/api/landing/email-capture/route.ts`
2. `modules/landing/components/shared/LandingErrorFallback.tsx`
3. `supabase/schema/landing_leads.sql` (migration)

### Modify:

1. `modules/landing/components/AwakeningChallengePage.tsx` - Multiple improvements
2. `modules/landing/components/shared/ExitIntentPopup.tsx` - Focus, error states
3. `modules/landing/components/shared/CTAButton.tsx` - Focus-visible
4. `modules/landing/components/sections/FAQSection.tsx` - ARIA
5. `modules/landing/components/sections/AboutSection.tsx` - Image optimization
6. `modules/landing/components/sections/VSLSection.tsx` - Video embed
7. `modules/landing/types.ts` - Add photoUrl to AboutContent
8. `modules/landing/data/content.ts` - Add photoUrl
9. `store/modules/payment/index.ts` - Proper thunk typing
10. `app/page.tsx` - Landing-specific metadata

---

## Expected Final Score: 9.6/10

| Category       | Before | After | Delta |
| -------------- | ------ | ----- | ----- |
| Code Quality   | 9      | 10    | +1    |
| Architecture   | 9      | 9.5   | +0.5  |
| Integration    | 8      | 10    | +2    |
| Type Safety    | 8      | 10    | +2    |
| Styling        | 9      | 9.5   | +0.5  |
| Accessibility  | 7      | 9.5   | +2.5  |
| Performance    | 8      | 9.5   | +1.5  |
| SEO            | 7      | 9.5   | +2.5  |
| Error Handling | 7      | 9.5   | +2.5  |
| Build Health   | 10     | 10    | 0     |

**Overall: 8.5 → 9.6** (+1.1 points)
