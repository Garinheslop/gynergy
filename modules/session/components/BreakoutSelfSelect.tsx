"use client";

import React, { useState } from "react";

import { cn } from "@lib/utils/style";
import type { BreakoutRoom } from "@resources/types/session";

interface BreakoutSelfSelectProps {
  rooms: BreakoutRoom[];
  onSelect: (roomId: string) => void;
  isJoining?: boolean;
}

/**
 * Topic picker for self-select breakout mode.
 * Participants choose which room to join based on topic.
 */
const BreakoutSelfSelect: React.FC<BreakoutSelfSelectProps> = ({
  rooms,
  onSelect,
  isJoining = false,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <span className="mb-2 inline-block text-4xl">🚪</span>
          <h3 className="text-lg font-bold text-white">Choose Your Room</h3>
          <p className="mt-1 text-sm text-gray-400">Pick the topic you&apos;d like to discuss</p>
        </div>

        <div className="mb-5 space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelected(room.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                selected === room.id
                  ? "border-teal-500 bg-teal-900/20"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              )}
            >
              <p className="font-medium text-white">{room.name}</p>
              {room.topic && <p className="mt-1 text-sm text-gray-400">{room.topic}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {room.participantCount || 0} / {room.maxParticipants} participants
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected || isJoining}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {isJoining ? "Joining..." : "Join Selected Room"}
        </button>
      </div>
    </div>
  );
};

export default BreakoutSelfSelect;
