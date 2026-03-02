"use client";

import { useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

type WelcomeState = "loading" | "exchanging" | "redirecting" | "error";

export default function WelcomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<WelcomeState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setErrorMessage("No onboarding token provided. Please check your link.");
      return;
    }

    async function exchangeToken(t: string) {
      setState("exchanging");

      try {
        const response = await fetch("/api/onboarding/token-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error === "token_expired" || data.error === "token_already_used") {
            setState("error");
            setErrorMessage(
              "This link has expired or already been used. Please log in with your email instead."
            );
            return;
          }
          throw new Error(data.error || "Token exchange failed");
        }

        // Redirect to the magic link action URL which will authenticate via Supabase
        if (data.actionLink) {
          setState("redirecting");
          window.location.href = data.actionLink;
        } else {
          // Fallback: redirect to login
          setState("error");
          setErrorMessage("Authentication setup failed. Please log in with your email.");
        }
      } catch (err) {
        console.error("Token exchange error:", err);
        setState("error");
        setErrorMessage("Something went wrong. Please try logging in with your email.");
      }
    }

    exchangeToken(token);
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md text-center">
        {(state === "loading" || state === "exchanging" || state === "redirecting") && (
          <div className="space-y-6">
            <div className="text-4xl font-light tracking-[0.3em] text-white">G Y N E R G Y</div>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
            <p className="text-sm text-gray-400">
              {state === "loading" && "Preparing your experience..."}
              {state === "exchanging" && "Setting up your account..."}
              {state === "redirecting" && "Welcome! Redirecting you now..."}
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-6">
            <div className="text-4xl font-light tracking-[0.3em] text-white">G Y N E R G Y</div>
            <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
              <p className="text-sm text-gray-300">{errorMessage}</p>
              <a
                href="/login"
                className="inline-block rounded bg-amber-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-400"
              >
                Go to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
