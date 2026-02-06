/**
 * Health API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase-server module
vi.mock("@lib/supabase-server", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@lib/supabase-server";

import { GET } from "../../../app/api/health/route";

const mockCreateServiceClient = vi.mocked(createServiceClient);

describe("Health API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variables
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  });

  describe("GET /api/health", () => {
    it("returns healthy status when all checks pass", async () => {
      // Mock successful database query
      mockCreateServiceClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: "test" }], error: null }),
          }),
        }),
      } as unknown as ReturnType<typeof createServiceClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.checks.database).toBe(true);
      expect(data.checks.environment).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(data.responseTime).toBeGreaterThanOrEqual(0);
    });

    it("returns degraded status when database check fails", async () => {
      // Mock failed database query
      mockCreateServiceClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue({ data: null, error: { message: "Connection failed" } }),
          }),
        }),
      } as unknown as ReturnType<typeof createServiceClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // degraded still returns 200
      expect(data.status).toBe("degraded");
      expect(data.checks.database).toBe(false);
      expect(data.checks.environment).toBe(true);
    });

    it("returns unhealthy status when environment check fails", async () => {
      // Remove required environment variables
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      // Mock database to also fail (since no connection possible)
      mockCreateServiceClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("No connection")),
          }),
        }),
      } as unknown as ReturnType<typeof createServiceClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database).toBe(false);
      expect(data.checks.environment).toBe(false);
    });

    it("handles database connection exceptions", async () => {
      mockCreateServiceClient.mockImplementation(() => {
        throw new Error("Connection timeout");
      });

      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe("degraded");
      expect(data.checks.database).toBe(false);
    });

    it("includes version from environment", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "2.0.0");

      mockCreateServiceClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: "test" }], error: null }),
          }),
        }),
      } as unknown as ReturnType<typeof createServiceClient>);

      const response = await GET();
      const data = await response.json();

      expect(data.version).toBe("2.0.0");
    });

    it("defaults version to 1.0.0 when not set", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");

      mockCreateServiceClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: "test" }], error: null }),
          }),
        }),
      } as unknown as ReturnType<typeof createServiceClient>);

      const response = await GET();
      const data = await response.json();

      expect(data.version).toBe("1.0.0");
    });
  });
});
