"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";

import {
  CommunityEvent,
  CommunityCallState,
  ResolvedCallState,
  EventAttendee,
  resolveEventState,
  getPollingInterval,
  CALL_STATE_PRIORITY,
} from "@resources/types/communityEvent";
import { RootState } from "@store/configureStore";
import { useDispatch, useSelector } from "@store/hooks";
import { setEvents, setEventsLoading, setEventsError } from "@store/modules/community";

interface UseCommunityCallStateResult {
  /** The highest-priority resolved state (for hero/sidebar) */
  primaryState: ResolvedCallState;
  /** All upcoming events */
  upcoming: CommunityEvent[];
  /** All past events */
  past: CommunityEvent[];
  /** Attendees by event ID */
  attendees: Record<string, EventAttendee[]>;
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh events */
  refresh: () => void;
  /** RSVP to an event */
  rsvp: (
    eventId: string,
    status: "accepted" | "declined" | "maybe"
  ) => Promise<{ success: boolean }>;
}

const NO_EVENTS_STATE: ResolvedCallState = {
  state: "no_events",
  event: null,
  minutesUntilStart: null,
  minutesRemaining: null,
  pollInterval: 600_000,
};

export function useCommunityCallState(): UseCommunityCallStateResult {
  const dispatch = useDispatch();
  const { events, eventsLoading, eventsError } = useSelector((state: RootState) => state.community);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollIntervalRef = useRef<number>(600_000);

  // ── Fetch Events ────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    dispatch(setEventsLoading(true));
    dispatch(setEventsError(null));

    try {
      const response = await fetch("/api/community/events");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      dispatch(
        setEvents({
          upcoming: data.upcoming,
          past: data.past,
          attendees: data.attendees,
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch events";
      dispatch(setEventsError(message));
    } finally {
      dispatch(setEventsLoading(false));
    }
  }, [dispatch]);

  // ── Resolve Primary State ───────────────────────────

  const primaryState: ResolvedCallState = useMemo(() => {
    if (!events.upcoming.length) return NO_EVENTS_STATE;

    let bestState: CommunityCallState = "no_events";
    let bestEvent: CommunityEvent | null = null;

    for (const event of events.upcoming) {
      const eventState = resolveEventState(event);
      if (CALL_STATE_PRIORITY[eventState] < CALL_STATE_PRIORITY[bestState]) {
        bestState = eventState;
        bestEvent = event;
      }
    }

    if (!bestEvent) return NO_EVENTS_STATE;

    const now = Date.now();
    const start = new Date(bestEvent.scheduledStart).getTime();
    const end = bestEvent.scheduledEnd
      ? new Date(bestEvent.scheduledEnd).getTime()
      : start + bestEvent.durationMinutes * 60 * 1000;

    return {
      state: bestState,
      event: bestEvent,
      minutesUntilStart: Math.round((start - now) / 60000),
      minutesRemaining:
        bestEvent.status === "live" ? Math.max(0, Math.round((end - now) / 60000)) : null,
      pollInterval: getPollingInterval(bestState),
    };
  }, [events.upcoming]);

  // ── Adaptive Polling ────────────────────────────────

  useEffect(() => {
    // Initial fetch
    fetchEvents();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchEvents]);

  useEffect(() => {
    const newInterval = primaryState.pollInterval;

    // Only restart timer if interval changed
    if (newInterval !== lastPollIntervalRef.current) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }

      pollTimerRef.current = setInterval(fetchEvents, newInterval);
      lastPollIntervalRef.current = newInterval;
    } else if (!pollTimerRef.current) {
      // Start timer if not running
      pollTimerRef.current = setInterval(fetchEvents, newInterval);
      lastPollIntervalRef.current = newInterval;
    }
  }, [primaryState.pollInterval, fetchEvents]);

  // ── RSVP ────────────────────────────────────────────

  const rsvp = useCallback(
    async (
      eventId: string,
      status: "accepted" | "declined" | "maybe"
    ): Promise<{ success: boolean }> => {
      // Optimistic update
      const updatedUpcoming = events.upcoming.map((e) =>
        e.id === eventId
          ? {
              ...e,
              userRsvpStatus: status as CommunityEvent["userRsvpStatus"],
              rsvpCount:
                status === "accepted"
                  ? e.rsvpCount + (e.userRsvpStatus === "accepted" ? 0 : 1)
                  : e.rsvpCount - (e.userRsvpStatus === "accepted" ? 1 : 0),
            }
          : e
      );

      dispatch(
        setEvents({
          upcoming: updatedUpcoming,
          past: events.past,
          attendees: events.attendees,
        })
      );

      try {
        const response = await fetch("/api/community/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, status }),
        });

        if (!response.ok) {
          // Revert on failure
          dispatch(
            setEvents({
              upcoming: events.upcoming,
              past: events.past,
              attendees: events.attendees,
            })
          );
          return { success: false };
        }

        return { success: true };
      } catch {
        // Revert on error
        dispatch(
          setEvents({
            upcoming: events.upcoming,
            past: events.past,
            attendees: events.attendees,
          })
        );
        return { success: false };
      }
    },
    [dispatch, events]
  );

  return {
    primaryState,
    upcoming: events.upcoming,
    past: events.past,
    attendees: events.attendees,
    loading: eventsLoading,
    error: eventsError,
    refresh: fetchEvents,
    rsvp,
  };
}
