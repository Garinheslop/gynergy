"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { SessionScheduleCard } from "@modules/session";
import { useSession } from "@modules/session";
import type { GroupSession } from "@resources/types/session";

export default function SessionListPage() {
  const router = useRouter();
  const { sessions, fetchUpcoming } = useSession();
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
        // Profile fetch failed — non-blocking
      }
    }
    loadProfile();
  }, []);

  // Fetch upcoming sessions
  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const handleJoinSession = (session: GroupSession) => {
    router.push(`/session/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Group Sessions</h1>
          <p className="mt-1 text-sm text-gray-400">
            Live coaching calls, hot seat sessions, and breakout rooms
          </p>
        </div>

        {/* Loading */}
        {sessions.loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {sessions.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center text-sm text-red-300">
            {sessions.error}
          </div>
        )}

        {/* Session list */}
        {!sessions.loading && sessions.data.length > 0 && (
          <div className="space-y-4">
            {sessions.data.map((session) => (
              <SessionScheduleCard
                key={session.id}
                session={session}
                isHost={session.hostId === userProfile?.id}
                onClick={() => handleJoinSession(session)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!sessions.loading && sessions.fetched && sessions.data.length === 0 && (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-12 text-center">
            <div className="mb-4 text-5xl">📅</div>
            <h3 className="mb-2 text-lg font-semibold text-white">No Upcoming Sessions</h3>
            <p className="text-sm text-gray-400">
              There are no group sessions scheduled right now. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
