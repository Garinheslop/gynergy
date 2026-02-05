// Force dynamic rendering - this page uses Redux state which can't be prerendered
export const dynamic = "force-dynamic";

import PaymentSuccessClient from "../../_components/PaymentSuccessClient";

export default function PaymentSuccessPage() {
  return <PaymentSuccessClient />;
}
