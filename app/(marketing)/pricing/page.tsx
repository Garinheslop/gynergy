"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

// Legacy pricing route - redirects to root landing page
export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
    </div>
  );
}
