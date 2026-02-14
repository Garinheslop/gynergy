"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { createClient } from "@supabase/supabase-js";

import { HostStudio } from "@modules/webinar";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WebinarData {
  id: string;
  title: string;
  status: string;
  hms_room_id: string;
}

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
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?redirect=" + encodeURIComponent(`/webinar/studio/${webinarId}`));
          return;
        }

        // Get webinar details
        const webinarResponse = await fetch(`/api/webinar/live?id=${webinarId}`);
        const webinarData = await webinarResponse.json();

        if (!webinarData.webinar) {
          setError("Webinar not found");
          setIsLoading(false);
          return;
        }

        setWebinar(webinarData.webinar);

        // Check if user is authorized (host or co-host)
        const isHost = webinarData.webinar.host_user_id === user.id;
        const isCoHost = webinarData.webinar.co_host_user_ids?.includes(user.id);

        if (!isHost && !isCoHost) {
          setError("You are not authorized to host this webinar");
          setIsLoading(false);
          return;
        }

        // Get broadcaster token
        const tokenResponse = await fetch("/api/webinar/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-host-token",
            webinarId,
            userId: user.id,
            userName: user.email,
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
        setError("Failed to load studio");
        setIsLoading(false);
      }
    };

    loadStudio();
  }, [webinarId, router]);

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

    // Update local state
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

    // Redirect to admin
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
          <button
            onClick={() => router.push("/admin/webinar")}
            className="rounded bg-amber-500 px-4 py-2 text-black"
          >
            Back to Admin
          </button>
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
