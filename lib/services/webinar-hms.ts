// ============================================
// 100MS WEBINAR SERVICE
// ============================================
// Extends base 100ms service with HLS streaming
// for live webinar broadcasting

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import type { HMSWebinarRoom, HMSHLSState, HMSWebinarToken } from "@resources/types/webinar";

// Environment variables
const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY;
const HMS_SECRET = process.env.HMS_SECRET;
// Use webinar-specific template if available, otherwise fall back to main template
const HMS_WEBINAR_TEMPLATE_ID = process.env.HMS_WEBINAR_TEMPLATE_ID || process.env.HMS_TEMPLATE_ID;

// 100ms API base URL
const HMS_API_BASE = "https://api.100ms.live/v2";

// ============================================
// CONFIGURATION CHECK
// ============================================

export function isWebinarConfigured(): boolean {
  return !!(HMS_ACCESS_KEY && HMS_SECRET && HMS_WEBINAR_TEMPLATE_ID);
}

export function getWebinarConfig() {
  return {
    hasCredentials: !!(HMS_ACCESS_KEY && HMS_SECRET),
    hasWebinarTemplate: !!HMS_WEBINAR_TEMPLATE_ID,
    templateId: HMS_WEBINAR_TEMPLATE_ID,
  };
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate management token for server-side API calls
 */
function generateManagementToken(): string {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error("100ms credentials not configured");
  }

  const payload = {
    access_key: HMS_ACCESS_KEY,
    type: "management",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, HMS_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: uuidv4(),
  });
}

/**
 * Generate auth token for broadcaster (host)
 * Broadcaster can publish video/audio and control HLS
 */
export function generateBroadcasterToken(options: {
  roomId: string;
  peerId: string;
  userId: string;
  userName?: string;
}): HMSWebinarToken {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error("100ms credentials not configured");
  }

  const { roomId, peerId, userId } = options;

  const payload = {
    access_key: HMS_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role: "host", // Maps to template's "host" role (can publish audio/video/screen)
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, HMS_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: peerId,
  });

  return {
    token,
    roomId,
    userId,
    role: "host",
  };
}

/**
 * Generate auth token for HLS viewer
 * Viewers can only watch the HLS stream, not publish
 */
export function generateViewerToken(options: {
  roomId: string;
  peerId: string;
  userId: string;
  userName?: string;
}): HMSWebinarToken {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error("100ms credentials not configured");
  }

  const { roomId, peerId, userId } = options;

  const payload = {
    access_key: HMS_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role: "guest", // Maps to template's "guest" role (can view streams)
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, HMS_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: peerId,
  });

  return {
    token,
    roomId,
    userId,
    role: "guest",
  };
}

// ============================================
// ROOM MANAGEMENT
// ============================================

/**
 * Create a new webinar room with HLS-enabled template
 */
export async function createWebinarRoom(options: {
  name: string;
  description?: string;
  region?: string;
}): Promise<HMSWebinarRoom> {
  if (!HMS_WEBINAR_TEMPLATE_ID) {
    throw new Error("Webinar template not configured. Set HMS_WEBINAR_TEMPLATE_ID");
  }

  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description || `Webinar: ${options.name}`,
      template_id: HMS_WEBINAR_TEMPLATE_ID,
      region: options.region || "us",
      recording_info: {
        enabled: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create webinar room");
  }

  return response.json();
}

/**
 * Get room details
 */
export async function getWebinarRoom(roomId: string): Promise<HMSWebinarRoom> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms/${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get webinar room");
  }

  return response.json();
}

/**
 * Get room code for easy joining
 */
export async function getWebinarRoomCode(roomId: string): Promise<string> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/room-codes/room/${roomId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get room code");
  }

  const data = await response.json();
  return data.code;
}

// ============================================
// HLS STREAMING
// ============================================

/**
 * Start HLS streaming for a webinar
 * This begins the live broadcast that viewers can watch
 */
export async function startHLSStreaming(options: {
  roomId: string;
  meetingUrl?: string;
  recordingEnabled?: boolean;
}): Promise<HMSHLSState> {
  const managementToken = generateManagementToken();

  const { roomId, meetingUrl, recordingEnabled = true } = options;

  // Build the HLS configuration
  const hlsConfig = {
    meeting_url: meetingUrl || `https://gynergy.app/webinar/studio/${roomId}`,
    recording: recordingEnabled
      ? {
          single_file_per_layer: true,
          hls_vod: true, // Enable HLS VOD for replay
          layers: [
            { width: 1920, height: 1080 }, // Full HD
            { width: 1280, height: 720 }, // HD
            { width: 640, height: 360 }, // SD
          ],
        }
      : undefined,
  };

  const response = await fetch(`${HMS_API_BASE}/live-streams/room/${roomId}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify(hlsConfig),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start HLS streaming");
  }

  return response.json();
}

/**
 * Stop HLS streaming
 */
export async function stopHLSStreaming(roomId: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/live-streams/room/${roomId}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // Ignore if stream wasn't running
    if (!error.message?.includes("not running")) {
      throw new Error(error.message || "Failed to stop HLS streaming");
    }
  }
}

/**
 * Get HLS streaming state
 */
export async function getHLSState(roomId: string): Promise<HMSHLSState | null> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/live-streams/room/${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    // Room might not have active HLS
    return null;
  }

  return response.json();
}

/**
 * Get the HLS stream URL for viewers
 */
export async function getHLSStreamUrl(roomId: string): Promise<string | null> {
  const hlsState = await getHLSState(roomId);

  if (!hlsState?.running || !hlsState.variants?.length) {
    return null;
  }

  // Return the first (best quality) variant URL
  return hlsState.variants[0].url;
}

// ============================================
// RECORDING MANAGEMENT
// ============================================

/**
 * Start recording (separate from HLS)
 */
export async function startRecording(roomId: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/recordings/room/${roomId}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      meeting_url: `https://gynergy.app/webinar/studio/${roomId}`,
      resolution: {
        width: 1920,
        height: 1080,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start recording");
  }
}

/**
 * Stop recording
 */
export async function stopRecording(roomId: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/recordings/room/${roomId}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    if (!error.message?.includes("not running")) {
      throw new Error(error.message || "Failed to stop recording");
    }
  }
}

/**
 * Get recordings for a room
 */
export async function getRecordings(roomId: string): Promise<
  Array<{
    id: string;
    room_id: string;
    status: string;
    asset_url?: string;
    duration: number;
    created_at: string;
  }>
> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/recordings?room_id=${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get recordings");
  }

  const data = await response.json();
  return data.data || [];
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * End the webinar room session
 */
export async function endWebinarSession(roomId: string, lock: boolean = false): Promise<void> {
  const managementToken = generateManagementToken();

  // First stop HLS if running
  await stopHLSStreaming(roomId).catch(() => {
    // Ignore errors if HLS wasn't running
  });

  // Then end the room
  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/end-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      reason: "Webinar ended by host",
      lock,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Room might not be active, which is fine
    if (error.code !== 404) {
      throw new Error(error.message || "Failed to end webinar session");
    }
  }
}

/**
 * Get active viewer count
 */
export async function getViewerCount(roomId: string): Promise<number> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/peers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  // Count peers with guest role (viewers in the Gynergy-Premium template)
  const viewers = data.peers?.filter((peer: { role: string }) => peer.role === "guest");
  return viewers?.length || 0;
}

/**
 * Send a message to all viewers (host announcement)
 */
export async function sendBroadcastMessage(roomId: string, message: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      message,
      type: "announcement",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send broadcast message");
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if webinar room exists and is enabled
 */
export async function isWebinarRoomActive(roomId: string): Promise<boolean> {
  try {
    const room = await getWebinarRoom(roomId);
    return room.enabled;
  } catch {
    return false;
  }
}

/**
 * Check if HLS is currently streaming
 */
export async function isHLSStreaming(roomId: string): Promise<boolean> {
  const hlsState = await getHLSState(roomId);
  return hlsState?.running || false;
}
