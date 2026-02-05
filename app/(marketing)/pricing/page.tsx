// Force dynamic rendering - this page uses client-side routing
export const dynamic = "force-dynamic";

import PricingRedirectClient from "../../_components/PricingRedirectClient";

export default function PricingPage() {
  return <PricingRedirectClient />;
}
