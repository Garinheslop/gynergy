// Force dynamic rendering - this page uses Redux state which can't be prerendered
export const dynamic = "force-dynamic";

import LandingPageClient from "./_components/LandingPageClient";

export default function LandingPage() {
  return <LandingPageClient />;
}
