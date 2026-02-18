"use client";

import { FC, useMemo } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import { CommunityEvent, CommunityCallState } from "@resources/types/communityEvent";

interface CommunityCallCardProps {
  event: CommunityEvent;
  state: CommunityCallState;
  onRsvp: (
    eventId: string,
    status: "accepted" | "declined" | "maybe"
  ) => Promise<{ success: boolean }>;
}

/**
 * Sidebar card showing the next/current community call.
 * State-aware: changes appearance for live, starting soon, upcoming.
 */
const CommunityCallCard: FC<CommunityCallCardProps> = ({ event, state, onRsvp }) => {
  const router = useRouter();
  const isLive = state === "live_now" || state === "ending_soon";
  const isStartingSoon = state === "starting_soon";
  const isRsvped = event.userRsvpStatus === "accepted";

  const timeDisplay = useMemo(() => {
    const date = new Date(event.scheduledStart);
    const now = new Date();

    if (isLive) {
      const elapsed = Math.round((now.getTime() - date.getTime()) / 60000);
      return `${elapsed} min in`;
    }

    if (isStartingSoon) {
      const mins = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
      return `Starts in ${mins} min`;
    }

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [event.scheduledStart, isLive, isStartingSoon]);

  const handleJoin = () => {
    triggerHaptic("medium");
    router.push(`/community/call/${event.roomId}`);
  };

  const handleRsvp = async () => {
    const newStatus = isRsvped ? "declined" : "accepted";
    const result = await onRsvp(event.id, newStatus);
    if (result.success) {
      triggerHaptic("success");
    }
  };

  return (
    <div
      className={cn(
        "border-border-light rounded-lg border p-4 transition-all",
        isLive && "border-danger/50 bg-danger/10 shadow-danger/5 shadow-lg",
        isStartingSoon && "border-action/50 bg-action/10",
        !isLive && !isStartingSoon && "bg-bkg-light"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-grey-500 text-xs font-semibold tracking-wider uppercase">
          {isLive ? "Live Now" : "Next Call"}
        </h3>
        {isLive && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-400">
              {event.participantCount} joined
            </span>
          </span>
        )}
      </div>

      {/* Event title */}
      <p className="text-content-dark mb-1 font-semibold">{event.title}</p>

      {/* Time */}
      <p
        className={cn(
          "mb-3 text-sm font-medium",
          isLive ? "text-red-400" : isStartingSoon ? "text-action-600" : "text-grey-500"
        )}
      >
        {timeDisplay}
      </p>

      {/* Host */}
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-grey-100 relative h-5 w-5 overflow-hidden rounded-full">
          {event.hostAvatar ? (
            <Image src={event.hostAvatar} alt={event.hostName} fill className="object-cover" />
          ) : (
            <div className="from-action-400 to-action-600 flex h-full w-full items-center justify-center bg-gradient-to-br text-[10px] font-semibold text-white">
              {event.hostName[0]}
            </div>
          )}
        </div>
        <span className="text-grey-500 text-xs">{event.hostName}</span>
      </div>

      {/* Action button */}
      {isLive || isStartingSoon ? (
        <button
          onClick={handleJoin}
          className={cn(
            "focus-visible:ring-action flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
            isLive
              ? "from-primary to-primary-500 text-content-dark bg-gradient-to-r"
              : "bg-action text-content-dark hover:bg-action-100"
          )}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {isLive ? "Join Now" : "Join Early"}
        </button>
      ) : (
        <button
          onClick={handleRsvp}
          className={cn(
            "focus-visible:ring-action flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
            isRsvped
              ? "bg-action-50 text-action-600 border-action/30 border"
              : "bg-action text-content-dark hover:bg-action-100"
          )}
        >
          {isRsvped ? "You're In" : "RSVP"}
        </button>
      )}
    </div>
  );
};

export default CommunityCallCard;
