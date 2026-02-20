"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import type { HotSeatTimerState } from "@resources/types/session";

interface HotSeatTimerProps {
  timerState: HotSeatTimerState;
  isHost: boolean;
  onExtend?: (extraSeconds: number) => void;
  onEnd?: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const HotSeatTimer: React.FC<HotSeatTimerProps> = ({ timerState, isHost, onExtend, onEnd }) => {
  const { userName, topic, remainingMs, percentComplete, isExpiring, isExpired } = timerState;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl px-4 py-3",
        "border transition-colors duration-300",
        isExpired
          ? "border-red-500/50 bg-red-900/30"
          : isExpiring
            ? "border-amber-500/50 bg-amber-900/20"
            : "border-teal-500/30 bg-teal-900/20"
      )}
    >
      {/* Speaker info */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
            isExpired ? "bg-red-500/30 text-red-300" : "bg-teal-500/30 text-teal-300"
          )}
        >
          {userName?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{userName}</p>
          {topic && <p className="text-xs text-gray-400">{topic}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-gray-700">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200",
              isExpired ? "bg-red-500" : isExpiring ? "bg-amber-500" : "bg-teal-500"
            )}
            style={{ width: `${100 - percentComplete}%` }}
          />
        </div>
      </div>

      {/* Time display */}
      <div
        className={cn(
          "min-w-[60px] text-center font-mono text-lg font-bold",
          isExpired ? "text-red-400" : isExpiring ? "text-amber-400" : "text-teal-400"
        )}
      >
        {isExpired ? "0:00" : formatTime(remainingMs)}
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="flex items-center gap-2">
          {!isExpired && (
            <>
              <button
                onClick={() => onExtend?.(60)}
                className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600"
              >
                +1 min
              </button>
              <button
                onClick={() => onExtend?.(120)}
                className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600"
              >
                +2 min
              </button>
            </>
          )}
          <button
            onClick={onEnd}
            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          >
            End
          </button>
        </div>
      )}
    </div>
  );
};

export default HotSeatTimer;
