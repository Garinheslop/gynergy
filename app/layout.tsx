import "@styles/globals.css";
import "@public/iconfonts/style.css";
// /app/layout.tsx
// This file defines the global layout for the application.

import type { Metadata, Viewport } from "next";

import DefaultLayout from "@modules/layouts/Default";
import Navbar from "@modules/layouts/Navbar";
import Providers from "@modules/providers";

// Viewport configuration (Next.js 14+ requires separate export)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

// Global layout that wraps the entire application.
// We apply NextAuthProvider to ensure session is available in client components.
export const metadata: Metadata = {
  title: "Gynergy - 45 Day Transformation",
  description: "Transform your life in 45 days with gratitude, AI coaching, and community support",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gynergy",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Gynergy",
    title: "Gynergy - 45 Day Transformation",
    description:
      "Transform your life in 45 days with gratitude, AI coaching, and community support",
    images: ["https://www.gynergy.app/images/meta-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gynergy - 45 Day Transformation",
    description:
      "Transform your life in 45 days with gratitude, AI coaching, and community support",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="bg-bkg-light-secondary min-h-screen">
            <DefaultLayout>{children}</DefaultLayout>
          </main>
        </Providers>
      </body>
    </html>
  );
}
