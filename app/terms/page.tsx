import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Gynergy",
  description: "Gynergy terms of service and usage agreement",
};

const TERMLY_TERMS_URL =
  "https://app.termly.io/policy-viewer/policy.html?policyUUID=547ca51c-f060-400b-baa0-d12d4adb9edf";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-content-light mb-6 text-2xl font-bold">Terms of Service</h1>
      <div className="bg-bkg-dark overflow-hidden rounded-lg shadow">
        <iframe
          src={TERMLY_TERMS_URL}
          title="Terms of Service"
          className="h-[80vh] w-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
