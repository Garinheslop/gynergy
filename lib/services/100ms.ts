// 100ms Video Service
// Handles room creation, token generation, and room management

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { HMSAuthTokenResponse, HMSRoomResponse, ParticipantRole } from "@resources/types/video";

// Environment variables
const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY;
const HMS_SECRET = process.env.HMS_SECRET;
const HMS_TEMPLATE_ID = process.env.HMS_TEMPLATE_ID;
const HMS_APP_ID = process.env.NEXT_PUBLIC_100MS_APP_ID;

// 100ms API base URL
const HMS_API_BASE = "https://api.100ms.live/v2";

// Check if 100ms is configured
export function is100msConfigured(): boolean {
  return !!(HMS_ACCESS_KEY && HMS_SECRET);
}

// Generate management token for server-side API calls
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

// Generate auth token for client-side room access
export function generateAuthToken(options: {
  roomId: string;
  peerId: string;
  role: ParticipantRole;
  userId: string;
  userName?: string;
}): HMSAuthTokenResponse {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error("100ms credentials not configured");
  }

  const { roomId, peerId, role, userId, userName: _userName } = options;

  // Map our roles to 100ms roles
  const hmsRole = mapRole(role);

  const payload = {
    access_key: HMS_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role: hmsRole,
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
    role: hmsRole,
  };
}

// Map our roles to 100ms template roles
function mapRole(role: ParticipantRole): string {
  switch (role) {
    case "host":
      return "host";
    case "co-host":
      return "co-host";
    case "participant":
    default:
      return "guest";
  }
}

// Create a new room via 100ms API
export async function createRoom(options: {
  name: string;
  description?: string;
  templateId?: string;
  region?: string;
  recordingEnabled?: boolean;
}): Promise<HMSRoomResponse> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      template_id: options.templateId || HMS_TEMPLATE_ID,
      region: options.region || "us",
      recording_info: options.recordingEnabled
        ? {
            enabled: true,
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create room");
  }

  return response.json();
}

// Get room details from 100ms API
export async function getRoom(roomId: string): Promise<HMSRoomResponse> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms/${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get room");
  }

  return response.json();
}

// Update room settings
export async function updateRoom(
  roomId: string,
  options: {
    name?: string;
    description?: string;
    recordingEnabled?: boolean;
  }
): Promise<HMSRoomResponse> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/rooms/${roomId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      recording_info:
        options.recordingEnabled !== undefined ? { enabled: options.recordingEnabled } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update room");
  }

  return response.json();
}

// Disable/end a room
export async function endRoom(roomId: string, lock: boolean = false): Promise<void> {
  const managementToken = generateManagementToken();

  // First, end the active session
  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/end-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      reason: "Session ended by host",
      lock,
    }),
  });

  if (!response.ok) {
    // Room might not be active, which is fine
    const error = await response.json();
    if (error.code !== 404) {
      throw new Error(error.message || "Failed to end room");
    }
  }
}

// Get active peers in a room
export async function getActivePeers(
  roomId: string
): Promise<{ peers: Array<{ peer_id: string; user_id: string; role: string; name: string }> }> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/peers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${managementToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get peers");
  }

  return response.json();
}

// Remove a peer from room
export async function removePeer(roomId: string, peerId: string, reason?: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/active-rooms/${roomId}/peers/${peerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      reason: reason || "Removed by host",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove peer");
  }
}

// Start recording
export async function startRecording(roomId: string): Promise<void> {
  const managementToken = generateManagementToken();

  const response = await fetch(`${HMS_API_BASE}/recordings/room/${roomId}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      meeting_url: `https://gynergy.co/video/${roomId}`,
      resolution: {
        width: 1280,
        height: 720,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start recording");
  }
}

// Stop recording
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
    throw new Error(error.message || "Failed to stop recording");
  }
}

// Get recording details
export async function getRecordings(roomId: string): Promise<{
  recordings: Array<{
    id: string;
    room_id: string;
    status: string;
    asset_url?: string;
    duration: number;
    created_at: string;
  }>;
}> {
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

  return response.json();
}

// Export app ID for client-side use
export function getAppId(): string {
  return HMS_APP_ID || "";
}
