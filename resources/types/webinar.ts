// ============================================
// WEBINAR TYPES
// ============================================
// Types for live webinar hosting via 100ms HLS

// ============================================
// ENUMS
// ============================================

export type WebinarStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";

export type WebinarRole = "host" | "co-host" | "viewer";

export type QAStatus = "pending" | "approved" | "answered" | "dismissed";

export type RegistrationSource = "landing_page" | "exit_intent" | "direct" | "email" | "admin";

// ============================================
// CORE WEBINAR TYPES
// ============================================

export interface Webinar {
  id: string;
  title: string;
  description?: string;
  slug: string;

  // Scheduling
  scheduledStart: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  timezone: string;

  // 100ms Integration
  hmsRoomId?: string;
  hmsRoomCode?: string;
  hmsTemplateId?: string;
  hlsStreamUrl?: string;
  hlsRecordingUrl?: string;

  // Status
  status: WebinarStatus;

  // Capacity
  maxAttendees: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;

  // Host Info
  hostUserId?: string;
  coHostUserIds: string[];

  // Content
  thumbnailUrl?: string;
  replayAvailable: boolean;
  replayUrl?: string;

  // Settings
  chatEnabled: boolean;
  qaEnabled: boolean;
  recordingEnabled: boolean;

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebinarAttendee {
  id: string;
  webinarId: string;

  // Attendee Info
  userId?: string;
  email: string;
  firstName?: string;

  // Registration
  registeredAt: Date;
  registrationSource: RegistrationSource;

  // Attendance
  joinedAt?: Date;
  leftAt?: Date;
  watchDurationSeconds: number;
  attendedLive: boolean;
  watchedReplay: boolean;

  // Engagement
  questionsAsked: number;
  chatMessagesSent: number;

  // Conversion
  convertedToChallenge: boolean;
  conversionDate?: Date;

  // Metadata
  metadata: Record<string, unknown>;
}

export interface WebinarQuestion {
  id: string;
  webinarId: string;

  // Question Info
  question: string;
  askedByEmail: string;
  askedByName?: string;
  askedByUserId?: string;
  askedAt: Date;

  // Status
  status: QAStatus;

  // Answer
  answeredAt?: Date;
  answeredByUserId?: string;
  answerText?: string;

  // Engagement
  upvotes: number;
  isPinned: boolean;

  // Metadata
  metadata: Record<string, unknown>;
}

export interface WebinarChatMessage {
  id: string;
  webinarId: string;

  // Message Info
  message: string;
  sentByEmail: string;
  sentByName?: string;
  sentByUserId?: string;
  sentAt: Date;

  // Moderation
  isHostMessage: boolean;
  isPinned: boolean;
  isDeleted: boolean;

  // Metadata
  metadata: Record<string, unknown>;
}

// ============================================
// 100MS WEBINAR TYPES
// ============================================

export interface HMSWebinarRoom {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  recording_info?: {
    enabled: boolean;
  };
  template_id: string;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface HMSHLSConfig {
  meetingUrl: string;
  playlistType: "audio+video" | "video" | "audio";
  recording?: {
    singleFilePerLayer: boolean;
    hlsVod: boolean;
    layers: Array<{
      width: number;
      height: number;
    }>;
  };
}

export interface HMSHLSState {
  running: boolean;
  variants: Array<{
    url: string;
    meetingUrl: string;
    startedAt?: string;
  }>;
}

export interface HMSWebinarToken {
  token: string;
  roomId: string;
  userId: string;
  role: "host" | "guest" | "co-host";
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateWebinarRequest {
  title: string;
  description?: string;
  slug: string;
  scheduledStart: string; // ISO date string
  scheduledEnd?: string;
  maxAttendees?: number;
  chatEnabled?: boolean;
  qaEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface CreateWebinarResponse {
  webinar: Webinar;
  hmsRoomId: string;
  hmsRoomCode: string;
}

export interface GoLiveRequest {
  webinarId: string;
}

export interface GoLiveResponse {
  success: boolean;
  hlsStreamUrl: string;
  webinar: Webinar;
}

export interface EndWebinarRequest {
  webinarId: string;
  saveRecording?: boolean;
}

export interface EndWebinarResponse {
  success: boolean;
  recordingUrl?: string;
  webinar: Webinar;
}

export interface JoinWebinarRequest {
  webinarId: string;
  email: string;
  firstName?: string;
}

export interface JoinWebinarResponse {
  success: boolean;
  token?: string; // Only for hosts
  hlsStreamUrl?: string; // For viewers
  webinar: Webinar;
  attendance: WebinarAttendee;
}

export interface WebinarStatusResponse {
  webinar: Webinar;
  viewerCount: number;
  isLive: boolean;
  hlsStreamUrl?: string;
  questions: WebinarQuestion[];
  recentChat: WebinarChatMessage[];
}

export interface SubmitQuestionRequest {
  webinarId: string;
  question: string;
  email: string;
  name?: string;
}

export interface SubmitQuestionResponse {
  success: boolean;
  question: WebinarQuestion;
}

export interface SendChatRequest {
  webinarId: string;
  message: string;
  email: string;
  name?: string;
}

export interface SendChatResponse {
  success: boolean;
  chatMessage: WebinarChatMessage;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface WebinarStudioProps {
  webinarId: string;
  authToken: string;
  onGoLive: () => Promise<void>;
  onEndWebinar: () => Promise<void>;
}

export interface WebinarViewerProps {
  webinarId: string;
  hlsStreamUrl: string;
  webinar: Webinar;
  onQuestionSubmit: (question: string) => Promise<void>;
  onChatSubmit: (message: string) => Promise<void>;
}

export interface WebinarQAProps {
  webinarId: string;
  questions: WebinarQuestion[];
  isHost: boolean;
  onApprove?: (questionId: string) => Promise<void>;
  onDismiss?: (questionId: string) => Promise<void>;
  onAnswer?: (questionId: string, answer: string) => Promise<void>;
}

export interface WebinarChatProps {
  webinarId: string;
  messages: WebinarChatMessage[];
  onSend: (message: string) => Promise<void>;
  isHost: boolean;
  onPin?: (messageId: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

// ============================================
// DATABASE ROW TYPES (for Supabase)
// ============================================

export interface WebinarRow {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  scheduled_start: string;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  timezone: string;
  hms_room_id: string | null;
  hms_room_code: string | null;
  hms_template_id: string | null;
  hls_stream_url: string | null;
  hls_recording_url: string | null;
  status: WebinarStatus;
  max_attendees: number;
  registration_required: boolean;
  registration_deadline: string | null;
  host_user_id: string | null;
  co_host_user_ids: string[];
  thumbnail_url: string | null;
  replay_available: boolean;
  replay_url: string | null;
  chat_enabled: boolean;
  qa_enabled: boolean;
  recording_enabled: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebinarAttendanceRow {
  id: string;
  webinar_id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  registered_at: string;
  registration_source: RegistrationSource;
  joined_at: string | null;
  left_at: string | null;
  watch_duration_seconds: number;
  attended_live: boolean;
  watched_replay: boolean;
  questions_asked: number;
  chat_messages_sent: number;
  converted_to_challenge: boolean;
  conversion_date: string | null;
  metadata: Record<string, unknown>;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function webinarRowToWebinar(row: WebinarRow): Webinar {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    slug: row.slug,
    scheduledStart: new Date(row.scheduled_start),
    scheduledEnd: row.scheduled_end ? new Date(row.scheduled_end) : undefined,
    actualStart: row.actual_start ? new Date(row.actual_start) : undefined,
    actualEnd: row.actual_end ? new Date(row.actual_end) : undefined,
    timezone: row.timezone,
    hmsRoomId: row.hms_room_id ?? undefined,
    hmsRoomCode: row.hms_room_code ?? undefined,
    hmsTemplateId: row.hms_template_id ?? undefined,
    hlsStreamUrl: row.hls_stream_url ?? undefined,
    hlsRecordingUrl: row.hls_recording_url ?? undefined,
    status: row.status,
    maxAttendees: row.max_attendees,
    registrationRequired: row.registration_required,
    registrationDeadline: row.registration_deadline
      ? new Date(row.registration_deadline)
      : undefined,
    hostUserId: row.host_user_id ?? undefined,
    coHostUserIds: row.co_host_user_ids,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    replayAvailable: row.replay_available,
    replayUrl: row.replay_url ?? undefined,
    chatEnabled: row.chat_enabled,
    qaEnabled: row.qa_enabled,
    recordingEnabled: row.recording_enabled,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function attendanceRowToAttendee(row: WebinarAttendanceRow): WebinarAttendee {
  return {
    id: row.id,
    webinarId: row.webinar_id,
    userId: row.user_id ?? undefined,
    email: row.email,
    firstName: row.first_name ?? undefined,
    registeredAt: new Date(row.registered_at),
    registrationSource: row.registration_source,
    joinedAt: row.joined_at ? new Date(row.joined_at) : undefined,
    leftAt: row.left_at ? new Date(row.left_at) : undefined,
    watchDurationSeconds: row.watch_duration_seconds,
    attendedLive: row.attended_live,
    watchedReplay: row.watched_replay,
    questionsAsked: row.questions_asked,
    chatMessagesSent: row.chat_messages_sent,
    convertedToChallenge: row.converted_to_challenge,
    conversionDate: row.conversion_date ? new Date(row.conversion_date) : undefined,
    metadata: row.metadata,
  };
}
