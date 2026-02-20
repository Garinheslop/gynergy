// Session Types for Group Coaching / Hot Seat / Breakout Rooms

export type SessionType = "group_coaching" | "hot_seat" | "workshop";
export type SessionStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";
export type HandRaiseStatus = "raised" | "acknowledged" | "active" | "completed" | "dismissed";
export type BreakoutAssignmentMethod = "random" | "manual" | "self_select";
export type BreakoutStatus = "pending" | "active" | "returning" | "closed";
export type SessionRole = "host" | "co-host" | "participant";

// ============================================================================
// Core Interfaces
// ============================================================================

export interface GroupSession {
  id: string;
  title: string;
  description?: string;
  sessionType: SessionType;
  scheduledStart: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  timezone: string;
  hmsRoomId?: string;
  hmsTemplateId?: string;
  hostId: string;
  coHostIds: string[];
  maxParticipants: number;
  status: SessionStatus;
  chatEnabled: boolean;
  qaEnabled: boolean;
  hotSeatEnabled: boolean;
  breakoutEnabled: boolean;
  recordingEnabled: boolean;
  hotSeatDurationSeconds: number;
  hotSeatAutoRotate: boolean;
  recordingUrl?: string;
  cohortId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  role: SessionRole;
  rsvpStatus: string;
  joinedAt?: string;
  leftAt?: string;
  durationSeconds: number;
  currentBreakoutId?: string;
  metadata: Record<string, unknown>;
  // Joined data
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
}

export interface HandRaise {
  id: string;
  sessionId: string;
  userId: string;
  status: HandRaiseStatus;
  raisedAt: string;
  acknowledgedAt?: string;
  activeAt?: string;
  completedAt?: string;
  hotSeatDurationSeconds?: number;
  hotSeatStartedAt?: string;
  hotSeatEndedAt?: string;
  timeExtendedSeconds: number;
  userName?: string;
  userAvatar?: string;
  topic?: string;
  metadata: Record<string, unknown>;
}

export interface BreakoutRoom {
  id: string;
  sessionId: string;
  name: string;
  topic?: string;
  roomNumber: number;
  hmsRoomId?: string;
  status: BreakoutStatus;
  maxParticipants: number;
  assignmentMethod: BreakoutAssignmentMethod;
  durationSeconds: number;
  startedAt?: string;
  endsAt?: string;
  endedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  // Joined/computed
  participantCount?: number;
  participants?: SessionParticipant[];
}

export interface SessionChatMessage {
  id: string;
  sessionId: string;
  message: string;
  sentByUserId?: string;
  sentByName?: string;
  sentAt: string;
  breakoutRoomId?: string;
  isHostMessage: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Hot Seat Timer (client-side computed)
// ============================================================================

export interface HotSeatTimerState {
  handRaiseId: string;
  userId: string;
  userName: string;
  topic?: string;
  startedAt: number; // epoch ms
  durationMs: number; // total allowed time
  extensionsMs: number; // extra time granted
  remainingMs: number; // computed
  percentComplete: number; // 0-100
  isActive: boolean;
  isExpiring: boolean; // < 60s
  isExpired: boolean;
}

// ============================================================================
// Database Row Types (snake_case from Supabase)
// ============================================================================

export interface GroupSessionRow {
  id: string;
  title: string;
  description: string | null;
  session_type: SessionType;
  scheduled_start: string;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  timezone: string;
  hms_room_id: string | null;
  hms_template_id: string | null;
  host_id: string;
  co_host_ids: string[];
  max_participants: number;
  status: string;
  chat_enabled: boolean;
  qa_enabled: boolean;
  hot_seat_enabled: boolean;
  breakout_enabled: boolean;
  recording_enabled: boolean;
  hot_seat_duration_seconds: number;
  hot_seat_auto_rotate: boolean;
  recording_url: string | null;
  cohort_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HandRaiseRow {
  id: string;
  session_id: string;
  user_id: string;
  status: HandRaiseStatus;
  raised_at: string;
  acknowledged_at: string | null;
  active_at: string | null;
  completed_at: string | null;
  hot_seat_duration_seconds: number | null;
  hot_seat_started_at: string | null;
  hot_seat_ended_at: string | null;
  time_extended_seconds: number;
  user_name: string | null;
  user_avatar: string | null;
  topic: string | null;
  metadata: Record<string, unknown>;
}

export interface BreakoutRoomRow {
  id: string;
  session_id: string;
  name: string;
  topic: string | null;
  room_number: number;
  hms_room_id: string | null;
  status: BreakoutStatus;
  max_participants: number;
  assignment_method: BreakoutAssignmentMethod;
  duration_seconds: number;
  started_at: string | null;
  ends_at: string | null;
  ended_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SessionParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  rsvp_status: string;
  joined_at: string | null;
  left_at: string | null;
  duration_seconds: number;
  current_breakout_id: string | null;
  metadata: Record<string, unknown>;
}

export interface SessionChatRow {
  id: string;
  session_id: string;
  message: string;
  sent_by_user_id: string | null;
  sent_by_name: string | null;
  sent_at: string;
  breakout_room_id: string | null;
  is_host_message: boolean;
  is_pinned: boolean;
  is_deleted: boolean;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Converters (Row → Model)
// ============================================================================

export function sessionRowToSession(row: GroupSessionRow): GroupSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    sessionType: row.session_type,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end ?? undefined,
    actualStart: row.actual_start ?? undefined,
    actualEnd: row.actual_end ?? undefined,
    timezone: row.timezone,
    hmsRoomId: row.hms_room_id ?? undefined,
    hmsTemplateId: row.hms_template_id ?? undefined,
    hostId: row.host_id,
    coHostIds: row.co_host_ids || [],
    maxParticipants: row.max_participants,
    status: row.status as SessionStatus,
    chatEnabled: row.chat_enabled,
    qaEnabled: row.qa_enabled,
    hotSeatEnabled: row.hot_seat_enabled,
    breakoutEnabled: row.breakout_enabled,
    recordingEnabled: row.recording_enabled,
    hotSeatDurationSeconds: row.hot_seat_duration_seconds,
    hotSeatAutoRotate: row.hot_seat_auto_rotate,
    recordingUrl: row.recording_url ?? undefined,
    cohortId: row.cohort_id ?? undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function handRaiseRowToHandRaise(row: HandRaiseRow): HandRaise {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    status: row.status,
    raisedAt: row.raised_at,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    activeAt: row.active_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    hotSeatDurationSeconds: row.hot_seat_duration_seconds ?? undefined,
    hotSeatStartedAt: row.hot_seat_started_at ?? undefined,
    hotSeatEndedAt: row.hot_seat_ended_at ?? undefined,
    timeExtendedSeconds: row.time_extended_seconds,
    userName: row.user_name ?? undefined,
    userAvatar: row.user_avatar ?? undefined,
    topic: row.topic ?? undefined,
    metadata: row.metadata || {},
  };
}

export function breakoutRowToBreakout(row: BreakoutRoomRow): BreakoutRoom {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    topic: row.topic ?? undefined,
    roomNumber: row.room_number,
    hmsRoomId: row.hms_room_id ?? undefined,
    status: row.status,
    maxParticipants: row.max_participants,
    assignmentMethod: row.assignment_method,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

export function chatRowToMessage(row: SessionChatRow): SessionChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    message: row.message,
    sentByUserId: row.sent_by_user_id ?? undefined,
    sentByName: row.sent_by_name ?? undefined,
    sentAt: row.sent_at,
    breakoutRoomId: row.breakout_room_id ?? undefined,
    isHostMessage: row.is_host_message,
    isPinned: row.is_pinned,
    isDeleted: row.is_deleted,
    metadata: row.metadata || {},
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  title: string;
  description?: string;
  sessionType?: SessionType;
  scheduledStart: string;
  scheduledEnd?: string;
  maxParticipants?: number;
  hotSeatEnabled?: boolean;
  hotSeatDurationSeconds?: number;
  breakoutEnabled?: boolean;
  chatEnabled?: boolean;
  recordingEnabled?: boolean;
  cohortId?: string;
}

export interface JoinSessionResponse {
  success: boolean;
  authToken: string;
  role: SessionRole;
  session: GroupSession;
  participants: SessionParticipant[];
  error?: string;
}

export interface CreateBreakoutRequest {
  sessionId: string;
  rooms: Array<{ name: string; topic?: string }>;
  assignmentMethod: BreakoutAssignmentMethod;
  durationSeconds: number;
}

// ============================================================================
// Redux State
// ============================================================================

export interface SessionState {
  sessions: {
    data: GroupSession[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  currentSession: {
    data: GroupSession | null;
    participants: SessionParticipant[];
    loading: boolean;
    error: string;
  };
  handRaises: {
    data: HandRaise[];
    loading: boolean;
  };
  breakoutRooms: {
    data: BreakoutRoom[];
    loading: boolean;
  };
  hotSeat: {
    active: HandRaise | null;
    timerState: HotSeatTimerState | null;
  };
  chat: {
    messages: SessionChatMessage[];
    loading: boolean;
  };
  connection: {
    isConnected: boolean;
    isConnecting: boolean;
    authToken: string | null;
    error: string;
  };
  breakoutConnection: {
    isInBreakout: boolean;
    breakoutRoomId: string | null;
    breakoutAuthToken: string | null;
  };
}
