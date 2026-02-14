// Force dynamic rendering - this page uses Redux state which can't be prerendered
export const dynamic = "force-dynamic";

import Script from "next/script";

import type { Metadata } from "next";

import { AwakeningChallengePage } from "@modules/landing";

// Landing page specific metadata
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
    "gratitude journal",
    "accountability group",
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

// JSON-LD Structured Data for the course
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "The 45-Day Awakening Challenge",
  description:
    "A 45-day transformation program for successful men across five life pillars: wealth, health, relationships, growth, and purpose.",
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

export default function LandingPage() {
  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AwakeningChallengePage />
    </>
  );
}
