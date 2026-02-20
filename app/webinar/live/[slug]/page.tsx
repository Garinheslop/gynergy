"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";

// Prevent search engines from indexing live webinar pages
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}

import { WebinarViewer } from "@modules/webinar";

interface WebinarData {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduledStart: string;
  chatEnabled: boolean;
  qaEnabled: boolean;
}

interface AttendanceData {
  id: string;
}

interface JoinResponse {
  success: boolean;
  webinar: WebinarData;
  attendance: AttendanceData;
  isLive: boolean;
  hlsStreamUrl: string | null;
  error?: string;
}

export default function WebinarLivePage() {
  useNoIndex();
  const params = useParams();
  const slug = params.slug as string;

  const [webinar, setWebinar] = useState<WebinarData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [hlsStreamUrl, setHlsStreamUrl] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Registration state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = useCallback(
    async (joinEmail: string, joinName?: string) => {
      setIsJoining(true);
      setError(null);

      try {
        const response = await fetch("/api/webinar/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            email: joinEmail,
            firstName: joinName,
          }),
        });

        const data: JoinResponse = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to join webinar");
          setIsJoining(false);
          setIsLoading(false);
          return;
        }

        // Save credentials per webinar slug to avoid cross-webinar collisions
        localStorage.setItem(`webinar_email_${slug}`, joinEmail);
        if (joinName) {
          localStorage.setItem(`webinar_name_${slug}`, joinName);
        }

        setWebinar(data.webinar);
        setAttendance(data.attendance);
        setIsLive(data.isLive);
        setHlsStreamUrl(data.hlsStreamUrl);
        setHasJoined(true);
        setIsJoining(false);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to join:", err);
        setError("Failed to join webinar. Please try again.");
        setIsJoining(false);
        setIsLoading(false);
      }
    },
    [slug]
  );

  // Check localStorage for saved email and auto-join
  useEffect(() => {
    const savedEmail = localStorage.getItem(`webinar_email_${slug}`);
    const savedName = localStorage.getItem(`webinar_name_${slug}`);
    if (savedEmail) {
      setEmail(savedEmail);
      setFirstName(savedName || "");
      // Auto-join if we have saved credentials
      handleJoin(savedEmail, savedName || undefined);
    } else {
      setIsLoading(false);
    }
  }, [handleJoin, slug]);

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleJoin(email, firstName || undefined);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-white">Loading webinar...</p>
        </div>
      </div>
    );
  }

  // Registration form (if not joined)
  if (!hasJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-6">
        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 text-4xl">🎬</div>
            <h1 className="mb-2 text-2xl font-bold text-white">Join the Webinar</h1>
            <p className="text-sm text-gray-400">Enter your email to access the live stream</p>
          </div>

          {error && (
            <div className="mb-4 rounded bg-red-900/50 p-3 text-sm text-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmitJoin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full rounded bg-gray-700 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Name (optional)
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded bg-gray-700 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={!email || isJoining}
              className="w-full rounded bg-amber-600 py-3 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isJoining ? "Joining..." : "Join Webinar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            By joining, you agree to receive communications about this webinar.
          </p>
        </div>
      </div>
    );
  }

  // Error state (after joining)
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="rounded bg-amber-500 px-4 py-2 text-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Webinar viewer
  if (!webinar || !attendance) {
    return null;
  }

  return (
    <WebinarViewer
      webinarId={webinar.id}
      webinarTitle={webinar.title}
      hlsStreamUrl={hlsStreamUrl}
      isLive={isLive}
      scheduledStart={new Date(webinar.scheduledStart)}
      chatEnabled={webinar.chatEnabled}
      qaEnabled={webinar.qaEnabled}
      userEmail={email}
      userName={firstName}
      attendanceId={attendance.id}
    />
  );
}
