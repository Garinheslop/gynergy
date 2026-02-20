"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import type { HotSeatTimerState } from "@resources/types/session";

interface HotSeatSpotlightProps {
  timerState: HotSeatTimerState | null;
}

/**
 * Overlay that shows hot seat status on top of the video grid.
 * Renders a subtle banner at the top of the video area.
 */
const HotSeatSpotlight: React.FC<HotSeatSpotlightProps> = ({ timerState }) => {
  if (!timerState || !timerState.isActive) return null;

  const { userName, topic, isExpiring } = timerState;

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 p-3">
      <div
        className={cn(
          "mx-auto flex max-w-md items-center justify-center gap-2 rounded-full px-4 py-2",
          "backdrop-blur-sm transition-colors duration-300",
          isExpiring
            ? "bg-amber-500/20 ring-1 ring-amber-500/40"
            : "bg-teal-500/20 ring-1 ring-teal-500/40"
        )}
      >
        <span className="text-sm">🔥</span>
        <span className="text-sm font-medium text-white">Hot Seat: {userName}</span>
        {topic && <span className="text-xs text-gray-300">— {topic}</span>}
      </div>
    </div>
  );
};

export default HotSeatSpotlight;
