"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import type { HandRaise } from "@resources/types/session";

interface HandRaiseQueueProps {
  queue: HandRaise[];
  isHost: boolean;
  onAcknowledge?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const HandRaiseQueue: React.FC<HandRaiseQueueProps> = ({
  queue,
  isHost,
  onAcknowledge,
  onActivate,
  onDismiss,
}) => {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="mb-2 text-3xl">✋</span>
        <p className="text-sm text-gray-400">No hands raised</p>
        <p className="mt-1 text-xs text-gray-500">
          Participants can raise their hand to request a turn
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Queue ({queue.length})</h4>
      </div>

      {queue.map((handRaise, index) => (
        <div
          key={handRaise.id}
          className={cn(
            "flex items-center gap-3 rounded-lg p-3",
            "border transition-colors",
            handRaise.status === "acknowledged"
              ? "border-amber-500/30 bg-amber-900/10"
              : "border-gray-700 bg-gray-800/50"
          )}
        >
          {/* Position number */}
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-gray-300">
            {index + 1}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {handRaise.userName || "Participant"}
            </p>
            {handRaise.topic && <p className="truncate text-xs text-gray-400">{handRaise.topic}</p>}
            <p className="text-xs text-gray-500">{timeAgo(handRaise.raisedAt)}</p>
          </div>

          {/* Host actions */}
          {isHost && (
            <div className="flex items-center gap-1">
              {handRaise.status === "raised" && (
                <button
                  onClick={() => onAcknowledge?.(handRaise.id)}
                  className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500"
                  title="Acknowledge"
                >
                  Ack
                </button>
              )}
              <button
                onClick={() => onActivate?.(handRaise.id)}
                className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-500"
                title="Start Hot Seat"
              >
                Go
              </button>
              <button
                onClick={() => onDismiss?.(handRaise.id)}
                className="rounded bg-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-500"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          )}

          {/* Status badge for non-hosts */}
          {!isHost && handRaise.status === "acknowledged" && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">Next</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default HandRaiseQueue;
