import type { Metadata } from "next";

import { AdminProviders } from "./providers";

export const metadata: Metadata = {
  title: "Admin Dashboard | Gynergy",
  description: "Gynergy Admin Dashboard - Platform management and analytics",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
