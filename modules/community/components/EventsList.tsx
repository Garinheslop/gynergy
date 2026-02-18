"use client";

import { FC, useState } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@lib/utils/style";
import { CommunityEvent, EventAttendee } from "@resources/types/communityEvent";

import EventCard from "./EventCard";

interface EventsListProps {
  upcoming: CommunityEvent[];
  past: CommunityEvent[];
  attendees: Record<string, EventAttendee[]>;
  loading: boolean;
  onRsvp: (
    eventId: string,
    status: "accepted" | "declined" | "maybe"
  ) => Promise<{ success: boolean }>;
}

/**
 * Events tab content showing upcoming and past events.
 */
const EventsList: FC<EventsListProps> = ({ upcoming, past, attendees, loading, onRsvp }) => {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);

  const handleJoin = (event: CommunityEvent) => {
    router.push(`/community/call/${event.roomId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border-light bg-bkg-light animate-pulse rounded-lg border p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-grey-200 h-5 w-20 rounded" />
              <div className="bg-grey-200 h-4 w-12 rounded" />
            </div>
            <div className="bg-grey-200 mb-2 h-5 w-48 rounded" />
            <div className="bg-grey-200 mb-3 h-4 w-32 rounded" />
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-grey-200 h-6 w-6 rounded-full" />
              <div className="bg-grey-200 h-3 w-24 rounded" />
            </div>
            <div className="bg-grey-200 h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="bg-action-50 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            className="text-action-600 h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-content-dark mb-2 text-xl font-bold">No Upcoming Events</h3>
        <p className="text-grey-500 mx-auto max-w-sm text-sm">
          Community calls will appear here when scheduled. Check back soon for upcoming events!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-content-dark mb-4 text-lg font-bold">Upcoming Events</h3>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attendees={attendees[event.id]}
                onRsvp={onRsvp}
                onJoin={handleJoin}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <section>
          <button
            onClick={() => setShowPast(!showPast)}
            className="text-grey-500 hover:text-content-dark focus-visible:ring-action mb-3 flex w-full items-center gap-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded={showPast}
          >
            <svg
              className={cn("h-4 w-4 transition-transform", showPast && "rotate-90")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Past Events ({past.length})
          </button>

          {showPast && (
            <div className="space-y-3">
              {past.map((event) => (
                <div
                  key={event.id}
                  className="border-border-light bg-bkg-light rounded-lg border p-4 opacity-75"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="text-content-dark font-semibold">{event.title}</h4>
                    {event.recordingUrl && (
                      <span className="text-action-600 bg-action-50 rounded px-2 py-0.5 text-xs font-medium">
                        Recording Available
                      </span>
                    )}
                  </div>
                  <p className="text-grey-500 mb-2 text-sm">
                    {new Date(event.scheduledStart).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {event.durationMinutes} min · {event.participantCount} attended
                  </p>
                  {event.recordingUrl && (
                    <a
                      href={event.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-action-600 hover:text-action-700 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
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
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EventsList;
