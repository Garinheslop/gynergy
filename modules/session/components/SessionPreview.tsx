"use client";

import React from "react";

import type { GroupSession } from "@resources/types/session";

interface SessionPreviewProps {
  session: GroupSession;
  participantCount: number;
  isHost: boolean;
  onJoin: () => void;
  isJoining?: boolean;
}

const SessionPreview: React.FC<SessionPreviewProps> = ({
  session,
  participantCount,
  isHost,
  onJoin,
  isJoining = false,
}) => {
  const startDate = new Date(session.scheduledStart);
  const isLive = session.status === "live";

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-800 p-6">
      {/* Status badge */}
      {isLive && (
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-400">LIVE NOW</span>
        </div>
      )}

      {/* Title */}
      <h2 className="mb-2 text-xl font-bold text-white">{session.title}</h2>

      {session.description && <p className="mb-4 text-sm text-gray-400">{session.description}</p>}

      {/* Details */}
      <div className="mb-6 space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>
            {startDate.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>🕐</span>
          <span>
            {startDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>
            {participantCount} / {session.maxParticipants} participants
          </span>
        </div>
        {session.hotSeatEnabled && (
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>
              Hot Seat enabled ({Math.floor(session.hotSeatDurationSeconds / 60)} min each)
            </span>
          </div>
        )}
        {session.breakoutEnabled && (
          <div className="flex items-center gap-2">
            <span>🚪</span>
            <span>Breakout rooms available</span>
          </div>
        )}
      </div>

      {/* Join button */}
      <button
        onClick={onJoin}
        disabled={isJoining}
        className="w-full rounded-xl bg-teal-600 py-3 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
      >
        {isJoining
          ? "Joining..."
          : isHost
            ? isLive
              ? "Rejoin as Host"
              : "Start Session"
            : isLive
              ? "Join Session"
              : "Join When Live"}
      </button>

      {isHost && !isLive && (
        <p className="mt-2 text-center text-xs text-gray-500">
          As the host, joining will start the session
        </p>
      )}
    </div>
  );
};

export default SessionPreview;
