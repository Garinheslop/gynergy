// Session-specific 100ms orchestration
// Wraps lib/services/100ms.ts for group coaching / breakout room management

import { createRoom, generateAuthToken, endRoom } from "@lib/services/100ms";
import type { ParticipantRole } from "@resources/types/video";

const HMS_TEMPLATE_ID = process.env.HMS_TEMPLATE_ID;

/**
 * Create a 100ms room for a group session
 */
export async function createSessionRoom(sessionTitle: string): Promise<string> {
  const room = await createRoom({
    name: `session-${sessionTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 50)}`,
    description: sessionTitle,
    templateId: HMS_TEMPLATE_ID,
    region: "us",
    recordingEnabled: true,
  });
  return room.id;
}

/**
 * Create multiple 100ms rooms for breakout sessions
 */
export async function createBreakoutRooms(
  sessionTitle: string,
  roomNames: string[]
): Promise<Array<{ hmsRoomId: string; name: string }>> {
  const results: Array<{ hmsRoomId: string; name: string }> = [];

  for (const name of roomNames) {
    const room = await createRoom({
      name: `breakout-${sessionTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`,
      description: `Breakout: ${name} (${sessionTitle})`,
      templateId: HMS_TEMPLATE_ID,
      region: "us",
      recordingEnabled: false,
    });
    results.push({ hmsRoomId: room.id, name });
  }

  return results;
}

/**
 * Generate auth tokens for participants in a breakout room
 */
export function generateBreakoutTokens(
  breakoutHmsRoomId: string,
  participants: Array<{ userId: string; userName: string; role: ParticipantRole }>
): Record<string, string> {
  const tokens: Record<string, string> = {};

  for (const p of participants) {
    const result = generateAuthToken({
      roomId: breakoutHmsRoomId,
      peerId: `breakout-${p.userId}-${Date.now()}`,
      role: p.role,
      userId: p.userId,
      userName: p.userName,
    });
    tokens[p.userId] = result.token;
  }

  return tokens;
}

/**
 * Generate a single auth token for the main session room
 */
export function generateSessionToken(
  hmsRoomId: string,
  userId: string,
  userName: string,
  role: ParticipantRole
): string {
  const result = generateAuthToken({
    roomId: hmsRoomId,
    peerId: `session-${userId}-${Date.now()}`,
    role,
    userId,
    userName,
  });
  return result.token;
}

/**
 * End all breakout rooms
 */
export async function endBreakoutRooms(hmsRoomIds: string[]): Promise<void> {
  const results = await Promise.allSettled(hmsRoomIds.map((id) => endRoom(id, true)));

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("Failed to end breakout room:", result.reason);
    }
  }
}

/**
 * End the main session room
 */
export async function endSessionRoom(hmsRoomId: string): Promise<void> {
  await endRoom(hmsRoomId, true);
}
