import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Gynergy",
  description: "Gynergy privacy policy and data handling practices",
};

const TERMLY_PRIVACY_URL =
  "https://app.termly.io/policy-viewer/policy.html?policyUUID=b816b72f-eba6-4079-9f6e-201d10b19e50";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-content-light mb-6 text-2xl font-bold">Privacy Policy</h1>
      <div className="bg-bkg-dark overflow-hidden rounded-lg shadow">
        <iframe
          src={TERMLY_PRIVACY_URL}
          title="Privacy Policy"
          className="h-[80vh] w-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
