// Video Types for 100ms Integration

export type VideoRoomType =
  | "cohort_call"
  | "one_on_one"
  | "community_checkin"
  | "accountability_pod";

export type VideoRoomStatus = "scheduled" | "live" | "ended" | "cancelled";

export type ParticipantRole = "host" | "co-host" | "participant";

export type RSVPStatus = "pending" | "accepted" | "declined" | "maybe";

export type InvitationStatus = "pending" | "accepted" | "declined";

// Video Room
export interface VideoRoom {
  id: string;
  roomId: string; // 100ms room ID
  roomType: VideoRoomType;
  title: string;
  description?: string;
  cohortId?: string;
  hostId: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  maxParticipants: number;
  isRecurring: boolean;
  recurrenceRule?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  status: VideoRoomStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Video Room with joined data
export interface VideoRoomWithDetails extends VideoRoom {
  hostName?: string;
  hostAvatar?: string;
  participantCount?: number;
  userRsvpStatus?: RSVPStatus;
  cohortName?: string;
}

// Room Participant
export interface VideoRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: ParticipantRole;
  rsvpStatus: RSVPStatus;
  joinedAt?: string;
  leftAt?: string;
  durationSeconds?: number;
  connectionQuality?: string;
}

// Participant with user data
export interface ParticipantWithUser extends VideoRoomParticipant {
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
}

// Call Notes
export interface VideoCallNote {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room Template
export interface VideoRoomTemplate {
  id: string;
  name: string;
  description?: string;
  roomType: VideoRoomType;
  defaultDurationMinutes: number;
  maxParticipants: number;
  recordingEnabled: boolean;
  settings?: Record<string, unknown>;
  createdBy?: string;
  isActive: boolean;
  createdAt: string;
}

// Room Invitation
export interface VideoRoomInvitation {
  id: string;
  roomId: string;
  inviteeId: string;
  invitedBy: string;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

// Create Room Request
export interface CreateRoomRequest {
  title: string;
  description?: string;
  roomType: VideoRoomType;
  cohortId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recordingEnabled?: boolean;
  templateId?: string;
}

// Join Room Request
export interface JoinRoomRequest {
  roomId: string;
  role?: ParticipantRole;
}

// Join Room Response
export interface JoinRoomResponse {
  authToken: string;
  roomId: string;
  role: ParticipantRole;
  roomDetails: VideoRoom;
}

// RSVP Request
export interface RSVPRequest {
  roomId: string;
  status: RSVPStatus;
}

// Send Invitation Request
export interface SendInvitationRequest {
  roomId: string;
  inviteeIds: string[];
  message?: string;
}

// 100ms Auth Token Response
export interface HMSAuthTokenResponse {
  token: string;
  roomId: string;
  userId: string;
  role: string;
}

// 100ms Room Response
export interface HMSRoomResponse {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  customer_id: string;
  recording_info?: {
    enabled: boolean;
  };
  template_id?: string;
  template?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

// Video API Request Types
export const videoRequestTypes = {
  // Room management
  createRoom: "create-room",
  getRoom: "get-room",
  getRooms: "get-rooms",
  updateRoom: "update-room",
  deleteRoom: "delete-room",
  endRoom: "end-room",

  // Joining
  joinRoom: "join-room",
  leaveRoom: "leave-room",

  // Participants
  getParticipants: "get-participants",
  updateParticipant: "update-participant",
  removeParticipant: "remove-participant",

  // RSVP
  rsvp: "rsvp",
  getUpcoming: "get-upcoming",

  // Invitations
  sendInvitation: "send-invitation",
  getInvitations: "get-invitations",
  respondInvitation: "respond-invitation",

  // Notes
  addNote: "add-note",
  getNotes: "get-notes",
  updateNote: "update-note",
  deleteNote: "delete-note",

  // Templates
  getTemplates: "get-templates",
} as const;

export type VideoRequestType = (typeof videoRequestTypes)[keyof typeof videoRequestTypes];

// Redux State
export interface VideoState {
  rooms: {
    data: VideoRoomWithDetails[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  currentRoom: {
    data: VideoRoomWithDetails | null;
    participants: ParticipantWithUser[];
    loading: boolean;
    error: string;
  };
  upcoming: {
    data: VideoRoomWithDetails[];
    loading: boolean;
    error: string;
  };
  invitations: {
    data: VideoRoomInvitation[];
    loading: boolean;
    error: string;
  };
  templates: {
    data: VideoRoomTemplate[];
    loading: boolean;
    fetched: boolean;
  };
  connection: {
    isConnected: boolean;
    isConnecting: boolean;
    authToken: string | null;
    error: string;
  };
}

// Room type display names
export const roomTypeLabels: Record<VideoRoomType, string> = {
  cohort_call: "Cohort Call",
  one_on_one: "1:1 Coaching",
  community_checkin: "Community Check-in",
  accountability_pod: "Accountability Pod",
};

// Room type descriptions
export const roomTypeDescriptions: Record<VideoRoomType, string> = {
  cohort_call: "Group video call for your entire cohort",
  one_on_one: "Private coaching session with a mentor",
  community_checkin: "Open drop-in session for community members",
  accountability_pod: "Small group accountability meeting",
};

// Default room settings by type
export const defaultRoomSettings: Record<
  VideoRoomType,
  {
    maxParticipants: number;
    defaultDuration: number;
    recordingEnabled: boolean;
  }
> = {
  cohort_call: {
    maxParticipants: 50,
    defaultDuration: 60,
    recordingEnabled: true,
  },
  one_on_one: {
    maxParticipants: 2,
    defaultDuration: 30,
    recordingEnabled: false,
  },
  community_checkin: {
    maxParticipants: 20,
    defaultDuration: 45,
    recordingEnabled: false,
  },
  accountability_pod: {
    maxParticipants: 5,
    defaultDuration: 30,
    recordingEnabled: false,
  },
};
