"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { HostStudio } from "@modules/webinar";

interface WebinarData {
  id: string;
  title: string;
  status: string;
  hms_room_id: string;
}

/**
 * Host Studio Page
 *
 * Auth flow: The get-host-token API verifies the caller's session
 * cookies against the webinar's host_user_id. No userId is sent
 * from the client — auth is entirely server-side.
 */
export default function WebinarStudioPage() {
  const params = useParams();
  const router = useRouter();
  const webinarId = params.webinarId as string;

  const [webinar, setWebinar] = useState<WebinarData | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudio = async () => {
      try {
        // Step 1: Fetch webinar details (public API, no auth needed)
        const webinarResponse = await fetch(`/api/webinar/live?id=${webinarId}`);
        const webinarData = await webinarResponse.json();

        if (!webinarData.webinar) {
          setError("Webinar not found");
          setIsLoading(false);
          return;
        }

        if (!webinarData.webinar.hms_room_id) {
          setError("100ms room not configured for this webinar");
          setIsLoading(false);
          return;
        }

        setWebinar(webinarData.webinar);

        // Step 2: Get broadcaster token — API verifies session cookies server-side
        const tokenResponse = await fetch("/api/webinar/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-host-token",
            webinarId,
            userName: "Host",
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.success) {
          setError(tokenData.error || "Failed to get studio access");
          setIsLoading(false);
          return;
        }

        setAuthToken(tokenData.token);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load studio:", err);
        setError(`Failed to load studio: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };

    loadStudio();
  }, [webinarId]);

  const handleGoLive = async () => {
    const response = await fetch("/api/webinar/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "go-live",
        webinarId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to go live");
    }

    setWebinar((prev) => (prev ? { ...prev, status: "live" } : null));
  };

  const handleEndWebinar = async () => {
    const response = await fetch("/api/webinar/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end",
        webinarId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to end webinar");
    }

    router.push("/admin/webinar");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-white">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => globalThis.location.reload()}
              className="rounded bg-white/10 px-4 py-2 text-white"
            >
              Retry
            </button>
            <Link href="/webinar" className="rounded bg-amber-500 px-4 py-2 text-black">
              Back to Webinar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!webinar || !authToken) {
    return null;
  }

  return (
    <HostStudio
      webinarId={webinarId}
      authToken={authToken}
      webinarTitle={webinar.title}
      onGoLive={handleGoLive}
      onEndWebinar={handleEndWebinar}
    />
  );
}
