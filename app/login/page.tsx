// Force dynamic rendering to prevent prerender errors
export const dynamic = "force-dynamic";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  return <LoginClient />;
}
