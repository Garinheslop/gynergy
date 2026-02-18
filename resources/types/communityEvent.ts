/**
 * Community Event Types
 *
 * Unified types for community calls/events with state machine
 * for driving multi-surface UI (hero, sidebar, events tab, mobile bar).
 */

import { VideoRoomStatus, RSVPStatus } from "./video";

// ── Event Format ──────────────────────────────────────

export type CommunityEventFormat = "video_call" | "webinar";

// ── State Machine ─────────────────────────────────────

export type CommunityCallState =
  | "live_now"
  | "ending_soon"
  | "starting_soon"
  | "today"
  | "upcoming_week"
  | "upcoming_future"
  | "just_ended"
  | "no_events";

/** Priority order for state display (lower = higher priority) */
export const CALL_STATE_PRIORITY: Record<CommunityCallState, number> = {
  live_now: 0,
  ending_soon: 1,
  starting_soon: 2,
  today: 3,
  upcoming_week: 4,
  upcoming_future: 5,
  just_ended: 6,
  no_events: 99,
};

// ── Community Event ───────────────────────────────────

export interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  format: CommunityEventFormat;

  // Scheduling
  scheduledStart: string; // ISO 8601
  scheduledEnd?: string;
  durationMinutes: number;

  // Status
  status: VideoRoomStatus;
  actualStart?: string;
  actualEnd?: string;

  // Host
  hostId: string;
  hostName: string;
  hostAvatar?: string;

  // Participation
  participantCount: number;
  maxParticipants: number;
  rsvpCount: number;
  userRsvpStatus?: RSVPStatus;

  // Room/joining
  roomId: string; // 100ms room ID or webinar slug
  hmsRoomId?: string; // 100ms internal room ID

  // Recording
  recordingEnabled: boolean;
  recordingUrl?: string;

  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string;

  // Metadata
  cohortId?: string;
  createdAt: string;
}

/** RSVP attendee with avatar for avatar stacks */
export interface EventAttendee {
  userId: string;
  userName: string;
  userAvatar?: string;
  rsvpStatus: RSVPStatus;
}

// ── Resolved State ────────────────────────────────────

export interface ResolvedCallState {
  state: CommunityCallState;
  event: CommunityEvent | null;
  /** Minutes until start (negative if past) */
  minutesUntilStart: number | null;
  /** Minutes remaining if live */
  minutesRemaining: number | null;
  /** Polling interval in ms based on state */
  pollInterval: number;
}

// ── API Response Types ────────────────────────────────

export interface CommunityEventsResponse {
  upcoming: CommunityEvent[];
  past: CommunityEvent[];
  attendees: Record<string, EventAttendee[]>; // eventId -> attendees
}

// ── UI Display Helpers ────────────────────────────────

export const EVENT_FORMAT_LABELS: Record<CommunityEventFormat, { label: string; color: string }> = {
  video_call: { label: "Video Call", color: "bg-action/20 text-action" },
  webinar: { label: "Webinar", color: "bg-primary/20 text-primary" },
};

export const CALL_STATE_LABELS: Record<CommunityCallState, string> = {
  live_now: "Live Now",
  ending_soon: "Ending Soon",
  starting_soon: "Starting Soon",
  today: "Today",
  upcoming_week: "This Week",
  upcoming_future: "Upcoming",
  just_ended: "Just Ended",
  no_events: "No Events",
};

// ── State Resolution ──────────────────────────────────

/** Resolve the current state of a single event */
export function resolveEventState(event: CommunityEvent): CommunityCallState {
  const now = Date.now();
  const start = new Date(event.scheduledStart).getTime();
  const end = event.scheduledEnd
    ? new Date(event.scheduledEnd).getTime()
    : start + event.durationMinutes * 60 * 1000;

  // Live events
  if (event.status === "live") {
    const remaining = (end - now) / 60000;
    return remaining <= 5 ? "ending_soon" : "live_now";
  }

  // Ended events
  if (event.status === "ended") {
    const endedAt = event.actualEnd ? new Date(event.actualEnd).getTime() : end;
    const hoursSinceEnd = (now - endedAt) / 3600000;
    return hoursSinceEnd <= 2 ? "just_ended" : "no_events";
  }

  // Scheduled events
  if (event.status === "scheduled") {
    const minutesUntil = (start - now) / 60000;
    if (minutesUntil <= 0) return "starting_soon"; // Past start time but not marked live
    if (minutesUntil <= 15) return "starting_soon";

    // Check if today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (start < todayEnd.getTime()) return "today";

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    if (start < weekEnd.getTime()) return "upcoming_week";

    return "upcoming_future";
  }

  return "no_events";
}

/** Get the adaptive polling interval based on state */
export function getPollingInterval(state: CommunityCallState): number {
  switch (state) {
    case "live_now":
    case "ending_soon":
    case "starting_soon":
      return 30_000; // 30 seconds
    case "today":
      return 60_000; // 1 minute
    case "upcoming_week":
      return 300_000; // 5 minutes
    default:
      return 600_000; // 10 minutes
  }
}
