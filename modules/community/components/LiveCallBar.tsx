"use client";

import { FC, useState } from "react";

import { useRouter } from "next/navigation";

import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import { CommunityEvent, CommunityCallState } from "@resources/types/communityEvent";

interface LiveCallBarProps {
  event: CommunityEvent;
  state: CommunityCallState;
}

/**
 * Mobile-only sticky bottom bar shown when a call is LIVE or STARTING SOON.
 * Hidden on desktop (sidebar card serves this purpose above lg breakpoint).
 * Dismissible per session via close button.
 */
const LiveCallBar: FC<LiveCallBarProps> = ({ event, state }) => {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const isLive = state === "live_now" || state === "ending_soon";

  if (dismissed) return null;
  if (state !== "live_now" && state !== "ending_soon" && state !== "starting_soon") {
    return null;
  }

  const handleJoin = () => {
    triggerHaptic("medium");
    router.push(`/community/call/${event.roomId}`);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 lg:hidden",
        "pb-[env(safe-area-inset-bottom,0px)]",
        isLive
          ? "bg-gradient-to-r from-red-900/95 to-red-800/95 backdrop-blur-lg"
          : "from-action-800/95 to-action-700/95 bg-gradient-to-r backdrop-blur-lg"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Live indicator */}
        {isLive && (
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        )}

        {/* Event info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{event.title}</p>
          <p className="text-xs text-white/70">
            {isLive ? `${event.participantCount} joined` : "Starting soon"}
          </p>
        </div>

        {/* Join button */}
        <button
          onClick={handleJoin}
          className="focus-visible:ring-action shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900 transition-all hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
        >
          Join
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1 text-white/50 transition-colors hover:text-white/80"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LiveCallBar;
