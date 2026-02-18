"use client";

import { FC, useMemo } from "react";

import Image from "next/image";

import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import {
  CommunityEvent,
  EventAttendee,
  EVENT_FORMAT_LABELS,
  resolveEventState,
} from "@resources/types/communityEvent";

import CalendarDropdown from "./CalendarDropdown";

interface EventCardProps {
  event: CommunityEvent;
  attendees?: EventAttendee[];
  onRsvp: (
    eventId: string,
    status: "accepted" | "declined" | "maybe"
  ) => Promise<{ success: boolean }>;
  onJoin?: (event: CommunityEvent) => void;
}

const EventCard: FC<EventCardProps> = ({ event, attendees = [], onRsvp, onJoin }) => {
  const eventState = resolveEventState(event);
  const isLive = eventState === "live_now" || eventState === "ending_soon";
  const isStartingSoon = eventState === "starting_soon";
  const isRsvped = event.userRsvpStatus === "accepted";

  const formattedDate = useMemo(() => {
    const date = new Date(event.scheduledStart);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;

    const dateStr = date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${dateStr} at ${timeStr}`;
  }, [event.scheduledStart]);

  const handleRsvp = async () => {
    const newStatus = isRsvped ? "declined" : "accepted";
    const result = await onRsvp(event.id, newStatus);
    if (result.success) {
      triggerHaptic("success");
    }
  };

  const handleJoin = () => {
    triggerHaptic("medium");
    onJoin?.(event);
  };

  const formatLabel = EVENT_FORMAT_LABELS[event.format];

  return (
    <div
      className={cn(
        "border-border-light bg-bkg-light rounded-lg border p-4 transition-colors",
        isLive && "border-danger/40 bg-danger/5",
        isStartingSoon && "border-action/40 bg-action/5"
      )}
    >
      {/* Top row: format badge + duration */}
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", formatLabel.color)}>
          {formatLabel.label}
        </span>

        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            LIVE
          </span>
        )}

        {!isLive && <span className="text-grey-500 text-xs">{event.durationMinutes} min</span>}
      </div>

      {/* Title */}
      <h3 className="text-content-dark mb-1 text-base font-semibold">{event.title}</h3>

      {/* Date/time */}
      <p className="text-grey-500 mb-3 text-sm">{formattedDate}</p>

      {/* Host */}
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-grey-100 relative h-6 w-6 overflow-hidden rounded-full">
          {event.hostAvatar ? (
            <Image src={event.hostAvatar} alt={event.hostName} fill className="object-cover" />
          ) : (
            <div className="from-action-400 to-action-600 flex h-full w-full items-center justify-center bg-gradient-to-br text-xs font-semibold text-white">
              {event.hostName[0]}
            </div>
          )}
        </div>
        <span className="text-grey-500 text-sm">Hosted by {event.hostName}</span>
      </div>

      {/* RSVP count + avatar stack */}
      <div className="mb-4 flex items-center gap-2">
        {attendees.length > 0 && (
          <div className="flex -space-x-2">
            {attendees.slice(0, 5).map((a) => (
              <div
                key={a.userId}
                className="border-bkg-light relative h-7 w-7 overflow-hidden rounded-full border-2"
              >
                {a.userAvatar ? (
                  <Image src={a.userAvatar} alt={a.userName} fill className="object-cover" />
                ) : (
                  <div className="bg-grey-100 text-grey-500 flex h-full w-full items-center justify-center text-xs">
                    {a.userName[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <span className="text-grey-500 text-xs">
          {event.rsvpCount > 0 ? `${event.rsvpCount} attending` : "Be the first to RSVP"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isLive || isStartingSoon ? (
          <button
            onClick={handleJoin}
            className={cn(
              "focus-visible:ring-action flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
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
              "focus-visible:ring-action flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
              isRsvped
                ? "bg-action-50 text-action-600 border-action/30 border"
                : "bg-action text-content-dark hover:bg-action-100"
            )}
          >
            {isRsvped ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                You&apos;re In
              </>
            ) : (
              "RSVP"
            )}
          </button>
        )}

        <CalendarDropdown
          event={{
            title: event.title,
            description: event.description || `Community call hosted by ${event.hostName}`,
            startDate: new Date(event.scheduledStart),
            durationMinutes: event.durationMinutes,
            location: `${typeof window !== "undefined" ? window.location.origin : ""}/community/call/${event.roomId}`,
          }}
        />
      </div>

      {/* Recording available badge */}
      {event.status === "ended" && event.recordingUrl && (
        <div className="border-grey-200 mt-3 border-t pt-3">
          <a
            href={event.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-action-600 hover:text-action-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Watch Recording
          </a>
        </div>
      )}
    </div>
  );
};

export default EventCard;
