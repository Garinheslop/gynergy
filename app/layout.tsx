import "@styles/globals.css";
import "@public/iconfonts/style.css";
// /app/layout.tsx
// This file defines the global layout for the application.

import type { Metadata } from "next";
import Navbar from "@modules/layouts/Navbar";
import DefaultLayout from "@modules/layouts/Default";
import Providers from "@modules/providers";

// Global layout that wraps the entire application.
// We apply NextAuthProvider to ensure session is available in client components.
export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
  },
  title: "Gynergy - DATE ZERO Gratitude Journal",
  description: "A Journey of gratitude and self discovery",
  openGraph: {
    images: ["https://www.gynergy.app/images/meta-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-bkg-light-secondary">
            <DefaultLayout>{children}</DefaultLayout>
          </main>
        </Providers>
      </body>
    </html>
  );
}
