"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import type { GroupSession } from "@resources/types/session";

interface SessionScheduleCardProps {
  session: GroupSession;
  isHost: boolean;
  onClick: () => void;
}

const sessionTypeLabels: Record<string, string> = {
  group_coaching: "Group Coaching",
  hot_seat: "Hot Seat",
  workshop: "Workshop",
};

const SessionScheduleCard: React.FC<SessionScheduleCardProps> = ({ session, isHost, onClick }) => {
  const startDate = new Date(session.scheduledStart);
  const isLive = session.status === "live";
  const isPast = session.status === "ended";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        "hover:border-teal-500/50 hover:bg-gray-800/80",
        isLive
          ? "border-red-500/30 bg-red-900/5"
          : isPast
            ? "border-gray-700/50 bg-gray-800/30 opacity-60"
            : "border-gray-700 bg-gray-800/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-white">{session.title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {sessionTypeLabels[session.sessionType] || session.sessionType}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          )}
          {isHost && (
            <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs text-teal-300">
              Host
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>
          {startDate.toLocaleDateString([], { month: "short", day: "numeric" })}
          {" at "}
          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span>Max {session.maxParticipants} participants</span>
      </div>
    </button>
  );
};

export default SessionScheduleCard;
