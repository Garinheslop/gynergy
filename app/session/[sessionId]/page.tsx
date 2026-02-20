"use client";

import React, { useCallback, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { GroupSessionHost, GroupSessionParticipant, SessionPreview } from "@modules/session";
import { useSession } from "@modules/session";

interface UserProfile {
  id: string;
  name: string;
}

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const {
    currentSession,
    connection,
    fetchSession,
    joinSession,
    startSession,
    leaveSession,
    endSession,
  } = useSession();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.profile) {
          setUserProfile({
            id: data.profile.id,
            name: data.profile.display_name || data.profile.full_name || "Member",
          });
        }
      } catch {
        setError("Failed to load your profile. Please refresh.");
      }
    }
    loadProfile();
  }, []);

  // Fetch session details
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  // Derive session and check host status
  const session = currentSession.data;
  const isHost = !!(
    session &&
    userProfile &&
    (session.hostId === userProfile.id || session.coHostIds?.includes(userProfile.id))
  );
  const isLive = session?.status === "live";

  // Update participant count from Redux state
  useEffect(() => {
    setParticipantCount(currentSession.participants.length);
  }, [currentSession.participants]);

  // Join session
  const handleJoin = useCallback(async () => {
    if (!sessionId || isJoining) return;
    setIsJoining(true);
    setError(null);

    try {
      // If host and session is not live, start it
      if (isHost && !isLive) {
        await startSession(sessionId);
      }

      const result = await joinSession(sessionId);
      if (!result) {
        setError("Failed to join session. Please try again.");
        setIsJoining(false);
        return;
      }

      setRole(result.role);
      setParticipantCount(result.participants.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join session");
    } finally {
      setIsJoining(false);
    }
  }, [sessionId, isJoining, isHost, isLive, startSession, joinSession]);

  // Leave session
  const handleLeave = useCallback(async () => {
    if (!sessionId) return;
    await leaveSession(sessionId);
    router.push("/session");
  }, [sessionId, leaveSession, router]);

  // End session (host only)
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    await endSession(sessionId);
    router.push("/session");
  }, [sessionId, endSession, router]);

  // Loading state
  if (currentSession.loading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (currentSession.error || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-400">{currentSession.error || error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/session")}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
            >
              Back to Sessions
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="mb-4 text-gray-400">Session not found</p>
          <button
            onClick={() => router.push("/session")}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  // Pre-join: show session preview with join button
  if (!connection.authToken || !connection.isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <SessionPreview
          session={session}
          participantCount={participantCount}
          isHost={isHost}
          onJoin={handleJoin}
          isJoining={isJoining}
        />
      </div>
    );
  }

  // In-session: render host or participant view
  const isHostRole = role === "host" || role === "co-host" || isHost;

  if (isHostRole) {
    return (
      <div className="h-screen bg-gray-900">
        <GroupSessionHost
          sessionId={sessionId}
          authToken={connection.authToken}
          sessionTitle={session.title}
          hostName={userProfile.name}
          hotSeatEnabled={session.hotSeatEnabled}
          breakoutEnabled={session.breakoutEnabled}
          chatEnabled={session.chatEnabled}
          onEndSession={handleEndSession}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <GroupSessionParticipant
        sessionId={sessionId}
        authToken={connection.authToken}
        sessionTitle={session.title}
        userId={userProfile.id}
        userName={userProfile.name}
        hotSeatEnabled={session.hotSeatEnabled}
        breakoutEnabled={session.breakoutEnabled}
        chatEnabled={session.chatEnabled}
        onLeave={handleLeave}
      />
    </div>
  );
}
