// Force dynamic rendering - this page uses client-side state
export const dynamic = "force-dynamic";

import Script from "next/script";

import type { Metadata } from "next";

import { WebinarLandingPage } from "@modules/landing";

// Webinar landing page specific metadata
export const metadata: Metadata = {
  title: "The 5 Pillars of Integrated Power | Free Live Training | GYNERGY",
  description:
    "Free live training: Why successful men feel empty and the one equation that changes everything. Learn the 10-minute daily practice that transforms your life across wealth, health, relationships, growth, and purpose.",
  keywords: [
    "free webinar",
    "mens transformation",
    "five pillars of life",
    "integrated power",
    "executive coaching",
    "life coaching for men",
    "personal development",
    "gratitude practice",
    "daily discipline",
    "garin heslop",
  ],
  openGraph: {
    title: "The 5 Pillars of Integrated Power | Free Live Training",
    description:
      "Why successful men feel empty — and the one equation that changes everything. Free live training with Garin Heslop.",
    url: "https://www.gynergy.app/webinar",
    siteName: "GYNERGY",
    images: [
      {
        url: "https://www.gynergy.app/images/og-webinar.jpg",
        width: 1200,
        height: 630,
        alt: "The 5 Pillars of Integrated Power - Free Live Training",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The 5 Pillars of Integrated Power | Free Live Training",
    description:
      "Why successful men feel empty — and the one equation that changes everything. Free live training.",
    images: ["https://www.gynergy.app/images/og-webinar.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.gynergy.app/webinar",
  },
};

// JSON-LD Structured Data for the Event
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "The 5 Pillars of Integrated Power - Free Live Training",
  description:
    "Free live training: Why successful men feel empty and the one equation that changes everything. Learn the 10-minute daily practice that transforms your life.",
  startDate: "2026-03-03T17:30:00-08:00",
  endDate: "2026-03-03T19:00:00-08:00",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "VirtualLocation",
    url: "https://www.gynergy.app/webinar",
  },
  organizer: {
    "@type": "Organization",
    name: "GYNERGY",
    url: "https://www.gynergy.app",
  },
  performer: {
    "@type": "Person",
    name: "Garin Heslop",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/LimitedAvailability",
    validFrom: "2026-01-01T00:00:00-08:00",
  },
  image: "https://www.gynergy.app/images/og-webinar.jpg",
};

export default function WebinarPage() {
  return (
    <>
      <Script
        id="event-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <WebinarLandingPage />
    </>
  );
}
