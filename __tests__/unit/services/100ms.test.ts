/**
 * 100ms Video Service Tests
 * Tests for video room creation, token generation, and room management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";

// We need to mock environment variables and fetch before importing the module
const originalEnv = { ...process.env };

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("100ms Video Service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Set up environment variables
    process.env.HMS_ACCESS_KEY = "test-access-key";
    process.env.HMS_SECRET = "test-secret-key-that-is-long-enough-for-jwt";
    process.env.HMS_TEMPLATE_ID = "test-template-id";
    process.env.NEXT_PUBLIC_100MS_APP_ID = "test-app-id";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("is100msConfigured", () => {
    it("should return true when both credentials are set", async () => {
      const { is100msConfigured } = await import("@lib/services/100ms");
      expect(is100msConfigured()).toBe(true);
    });

    it("should return false when HMS_ACCESS_KEY is missing", async () => {
      delete process.env.HMS_ACCESS_KEY;
      vi.resetModules();
      const { is100msConfigured } = await import("@lib/services/100ms");
      expect(is100msConfigured()).toBe(false);
    });

    it("should return false when HMS_SECRET is missing", async () => {
      delete process.env.HMS_SECRET;
      vi.resetModules();
      const { is100msConfigured } = await import("@lib/services/100ms");
      expect(is100msConfigured()).toBe(false);
    });

    it("should return false when both credentials are missing", async () => {
      delete process.env.HMS_ACCESS_KEY;
      delete process.env.HMS_SECRET;
      vi.resetModules();
      const { is100msConfigured } = await import("@lib/services/100ms");
      expect(is100msConfigured()).toBe(false);
    });
  });

  describe("generateAuthToken", () => {
    it("should generate a valid JWT token for host role", async () => {
      const { generateAuthToken } = await import("@lib/services/100ms");

      const result = generateAuthToken({
        roomId: "room-123",
        peerId: "peer-456",
        role: "host",
        userId: "user-789",
        userName: "Test User",
      });

      expect(result.token).toBeDefined();
      expect(result.roomId).toBe("room-123");
      expect(result.userId).toBe("user-789");
      expect(result.role).toBe("host");

      // Verify JWT structure
      const decoded = jwt.decode(result.token) as jwt.JwtPayload;
      expect(decoded.access_key).toBe("test-access-key");
      expect(decoded.room_id).toBe("room-123");
      expect(decoded.user_id).toBe("user-789");
      expect(decoded.role).toBe("host");
      expect(decoded.type).toBe("app");
      expect(decoded.version).toBe(2);
    });

    it("should generate token for co-host role", async () => {
      const { generateAuthToken } = await import("@lib/services/100ms");

      const result = generateAuthToken({
        roomId: "room-123",
        peerId: "peer-456",
        role: "co-host",
        userId: "user-789",
      });

      expect(result.role).toBe("co-host");

      const decoded = jwt.decode(result.token) as jwt.JwtPayload;
      expect(decoded.role).toBe("co-host");
    });

    it("should generate token for participant role (maps to guest)", async () => {
      const { generateAuthToken } = await import("@lib/services/100ms");

      const result = generateAuthToken({
        roomId: "room-123",
        peerId: "peer-456",
        role: "participant",
        userId: "user-789",
      });

      expect(result.role).toBe("guest");

      const decoded = jwt.decode(result.token) as jwt.JwtPayload;
      expect(decoded.role).toBe("guest");
    });

    it("should throw error when credentials not configured", async () => {
      delete process.env.HMS_ACCESS_KEY;
      vi.resetModules();
      const { generateAuthToken } = await import("@lib/services/100ms");

      expect(() =>
        generateAuthToken({
          roomId: "room-123",
          peerId: "peer-456",
          role: "host",
          userId: "user-789",
        })
      ).toThrow("100ms credentials not configured");
    });

    it("should use peerId as JWT ID", async () => {
      const { generateAuthToken } = await import("@lib/services/100ms");

      const result = generateAuthToken({
        roomId: "room-123",
        peerId: "unique-peer-id",
        role: "host",
        userId: "user-789",
      });

      const decoded = jwt.decode(result.token, { complete: true });
      expect(decoded?.header?.kid).toBeUndefined(); // kid is not set
      expect(decoded?.payload).toHaveProperty("jti", "unique-peer-id");
    });
  });

  describe("createRoom", () => {
    it("should create a room with default options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "new-room-id",
          name: "Test Room",
          enabled: true,
        }),
      });

      const { createRoom } = await import("@lib/services/100ms");

      const result = await createRoom({
        name: "Test Room",
      });

      expect(result.id).toBe("new-room-id");
      expect(result.name).toBe("Test Room");

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/rooms");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers.Authorization).toMatch(/^Bearer /);

      const body = JSON.parse(options.body);
      expect(body.name).toBe("Test Room");
      expect(body.template_id).toBe("test-template-id");
      expect(body.region).toBe("us");
    });

    it("should create a room with custom options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "new-room-id",
          name: "Custom Room",
          description: "A custom room",
          enabled: true,
        }),
      });

      const { createRoom } = await import("@lib/services/100ms");

      await createRoom({
        name: "Custom Room",
        description: "A custom room",
        templateId: "custom-template",
        region: "eu",
        recordingEnabled: true,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.name).toBe("Custom Room");
      expect(body.description).toBe("A custom room");
      expect(body.template_id).toBe("custom-template");
      expect(body.region).toBe("eu");
      expect(body.recording_info).toEqual({ enabled: true });
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Invalid template ID",
        }),
      });

      const { createRoom } = await import("@lib/services/100ms");

      await expect(
        createRoom({
          name: "Test Room",
        })
      ).rejects.toThrow("Invalid template ID");
    });

    it("should throw generic error when no message in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { createRoom } = await import("@lib/services/100ms");

      await expect(
        createRoom({
          name: "Test Room",
        })
      ).rejects.toThrow("Failed to create room");
    });
  });

  describe("getRoom", () => {
    it("should get room details", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "room-123",
          name: "Test Room",
          enabled: true,
          created_at: "2024-01-15T10:00:00Z",
        }),
      });

      const { getRoom } = await import("@lib/services/100ms");

      const result = await getRoom("room-123");

      expect(result.id).toBe("room-123");
      expect(result.name).toBe("Test Room");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/rooms/room-123");
      expect(options.method).toBe("GET");
    });

    it("should throw error when room not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Room not found",
        }),
      });

      const { getRoom } = await import("@lib/services/100ms");

      await expect(getRoom("nonexistent-room")).rejects.toThrow("Room not found");
    });
  });

  describe("updateRoom", () => {
    it("should update room name", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "room-123",
          name: "Updated Room Name",
        }),
      });

      const { updateRoom } = await import("@lib/services/100ms");

      const result = await updateRoom("room-123", {
        name: "Updated Room Name",
      });

      expect(result.name).toBe("Updated Room Name");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/rooms/room-123");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.name).toBe("Updated Room Name");
    });

    it("should update recording settings", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "room-123",
          recording_info: { enabled: true },
        }),
      });

      const { updateRoom } = await import("@lib/services/100ms");

      await updateRoom("room-123", {
        recordingEnabled: true,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.recording_info).toEqual({ enabled: true });
    });
  });

  describe("endRoom", () => {
    it("should end an active room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { endRoom } = await import("@lib/services/100ms");

      await endRoom("room-123");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/active-rooms/room-123/end-room");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.reason).toBe("Session ended by host");
      expect(body.lock).toBe(false);
    });

    it("should end and lock a room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { endRoom } = await import("@lib/services/100ms");

      await endRoom("room-123", true);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.lock).toBe(true);
    });

    it("should not throw when room is not active (404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: 404,
          message: "Room not active",
        }),
      });

      const { endRoom } = await import("@lib/services/100ms");

      // Should not throw
      await expect(endRoom("room-123")).resolves.toBeUndefined();
    });

    it("should throw for other errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: 500,
          message: "Internal server error",
        }),
      });

      const { endRoom } = await import("@lib/services/100ms");

      await expect(endRoom("room-123")).rejects.toThrow("Internal server error");
    });
  });

  describe("getActivePeers", () => {
    it("should get list of active peers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          peers: [
            { peer_id: "peer-1", user_id: "user-1", role: "host", name: "Host User" },
            { peer_id: "peer-2", user_id: "user-2", role: "guest", name: "Guest User" },
          ],
        }),
      });

      const { getActivePeers } = await import("@lib/services/100ms");

      const result = await getActivePeers("room-123");

      expect(result.peers).toHaveLength(2);
      expect(result.peers[0].peer_id).toBe("peer-1");
      expect(result.peers[0].role).toBe("host");
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Room not found",
        }),
      });

      const { getActivePeers } = await import("@lib/services/100ms");

      await expect(getActivePeers("nonexistent-room")).rejects.toThrow("Room not found");
    });
  });

  describe("removePeer", () => {
    it("should remove a peer from room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { removePeer } = await import("@lib/services/100ms");

      await removePeer("room-123", "peer-456");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/active-rooms/room-123/peers/peer-456");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.reason).toBe("Removed by host");
    });

    it("should use custom reason when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { removePeer } = await import("@lib/services/100ms");

      await removePeer("room-123", "peer-456", "Violation of guidelines");

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.reason).toBe("Violation of guidelines");
    });
  });

  describe("startRecording", () => {
    it("should start recording for a room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { startRecording } = await import("@lib/services/100ms");

      await startRecording("room-123");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/recordings/room/room-123/start");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.meeting_url).toContain("room-123");
      expect(body.resolution.width).toBe(1280);
      expect(body.resolution.height).toBe(720);
    });

    it("should throw error when recording fails to start", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Recording already in progress",
        }),
      });

      const { startRecording } = await import("@lib/services/100ms");

      await expect(startRecording("room-123")).rejects.toThrow("Recording already in progress");
    });
  });

  describe("stopRecording", () => {
    it("should stop recording for a room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { stopRecording } = await import("@lib/services/100ms");

      await stopRecording("room-123");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/recordings/room/room-123/stop");
      expect(options.method).toBe("POST");
    });
  });

  describe("getRecordings", () => {
    it("should get recordings for a room", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recordings: [
            {
              id: "rec-1",
              room_id: "room-123",
              status: "completed",
              asset_url: "https://recordings.100ms.live/rec-1.mp4",
              duration: 3600,
              created_at: "2024-01-15T10:00:00Z",
            },
          ],
        }),
      });

      const { getRecordings } = await import("@lib/services/100ms");

      const result = await getRecordings("room-123");

      expect(result.recordings).toHaveLength(1);
      expect(result.recordings[0].id).toBe("rec-1");
      expect(result.recordings[0].status).toBe("completed");
      expect(result.recordings[0].duration).toBe(3600);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.100ms.live/v2/recordings?room_id=room-123");
    });
  });

  describe("getAppId", () => {
    it("should return the configured app ID", async () => {
      const { getAppId } = await import("@lib/services/100ms");
      expect(getAppId()).toBe("test-app-id");
    });

    it("should return empty string when not configured", async () => {
      delete process.env.NEXT_PUBLIC_100MS_APP_ID;
      vi.resetModules();
      const { getAppId } = await import("@lib/services/100ms");
      expect(getAppId()).toBe("");
    });
  });
});
