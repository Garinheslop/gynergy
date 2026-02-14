import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Webinar | The 5 Pillars of Integrated Power | GYNERGY",
  description:
    "Watch the live training: Why successful men feel empty and the one equation that changes everything.",
  openGraph: {
    title: "Live Webinar | The 5 Pillars of Integrated Power",
    description:
      "Watch the live training with Garin Heslop. Learn the 10-minute daily practice that transforms your life.",
    type: "website",
    images: [
      {
        url: "https://www.gynergy.app/images/og-webinar.jpg",
        width: 1200,
        height: 630,
        alt: "The 5 Pillars of Integrated Power - Live Webinar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Webinar | The 5 Pillars of Integrated Power",
    description: "Watch the live training with Garin Heslop.",
    images: ["https://www.gynergy.app/images/og-webinar.jpg"],
  },
  robots: {
    index: false, // Don't index live pages
    follow: true,
  },
};

export default function WebinarLiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
