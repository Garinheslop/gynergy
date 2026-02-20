"use client";

import React from "react";

import type { BreakoutRoom } from "@resources/types/session";

interface BreakoutAssignmentProps {
  breakoutRoom: BreakoutRoom;
  onJoin: () => void;
  isJoining?: boolean;
}

/**
 * Overlay shown to participants when breakout rooms are active
 * and they've been assigned to a room.
 */
const BreakoutAssignment: React.FC<BreakoutAssignmentProps> = ({
  breakoutRoom,
  onJoin,
  isJoining = false,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center shadow-2xl">
        <span className="mb-3 inline-block text-4xl">🚪</span>
        <h3 className="mb-1 text-lg font-bold text-white">Breakout Time!</h3>
        <p className="mb-4 text-sm text-gray-400">You&apos;ve been assigned to:</p>

        <div className="mb-5 rounded-xl border border-teal-500/30 bg-teal-900/20 p-4">
          <p className="text-lg font-semibold text-teal-300">{breakoutRoom.name}</p>
          {breakoutRoom.topic && <p className="mt-1 text-sm text-gray-400">{breakoutRoom.topic}</p>}
          <p className="mt-2 text-xs text-gray-500">
            {Math.floor(breakoutRoom.durationSeconds / 60)} min session
          </p>
        </div>

        <button
          onClick={onJoin}
          disabled={isJoining}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {isJoining ? "Joining..." : "Join Breakout Room"}
        </button>
      </div>
    </div>
  );
};

export default BreakoutAssignment;
