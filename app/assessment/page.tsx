// Force dynamic rendering - this page uses client-side state and localStorage
export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { AssessmentPageV3 } from "@modules/landing";

// Assessment page specific metadata
export const metadata: Metadata = {
  title: "Five Pillar Assessment | The Truth You've Been Avoiding | GYNERGY",
  description:
    "23 questions. 12 minutes. Discover your Five Pillar Score and which pillar is silently bleeding. Personalized insights for successful men.",
  keywords: [
    "life assessment",
    "self assessment",
    "five pillars",
    "life score",
    "personal development quiz",
    "mens coaching",
    "life evaluation",
  ],
  openGraph: {
    title: "Five Pillar Self-Assessment | GYNERGY",
    description:
      "5 questions. 2 minutes. Score your life across wealth, health, relationships, growth, and purpose.",
    url: "https://www.gynergy.app/assessment",
    siteName: "GYNERGY",
    images: [
      {
        url: "https://www.gynergy.app/images/og-assessment.jpg",
        width: 1200,
        height: 630,
        alt: "Five Pillar Self-Assessment",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Five Pillar Self-Assessment | GYNERGY",
    description: "5 questions. 2 minutes. Score your life across the five pillars.",
    images: ["https://www.gynergy.app/images/og-assessment.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.gynergy.app/assessment",
  },
};

export default function AssessmentRoute() {
  return <AssessmentPageV3 />;
}
