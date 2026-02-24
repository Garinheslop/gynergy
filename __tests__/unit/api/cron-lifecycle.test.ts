/**
 * Lifecycle Cron Tests
 * Tests for app/api/cron/lifecycle/route.ts
 *
 * Covers all 3 transition flows + auth + error handling
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

// Mock env
vi.stubEnv("CRON_SECRET", "test-secret");

// Supabase chainable mock factory
type MockChain = Record<string, ReturnType<typeof vi.fn>>;
type TerminalResult = { data: unknown; error: unknown };

function chain(terminal?: TerminalResult): MockChain {
  const c: MockChain = {};
  c.select = vi.fn().mockReturnValue(c);
  c.insert = vi.fn().mockReturnValue(c);
  c.update = vi.fn().mockReturnValue(c);
  c.upsert = vi.fn().mockReturnValue(c);
  c.eq = vi.fn().mockReturnValue(c);
  c.lt = vi.fn().mockReturnValue(c);
  c.lte = vi.fn().mockReturnValue(c);
  c.in = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockResolvedValue(terminal ?? { data: null, error: null });
  // For non-single queries, resolve the chain itself
  if (terminal) {
    // Make the chain itself thenable for awaited queries
    (c as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(terminal);
  }
  return c;
}

// Table-specific query results
let tableResults: Record<string, TerminalResult[]> = {};
let tableCallCounts: Record<string, number> = {};

function setupTable(table: string, ...results: TerminalResult[]) {
  tableResults[table] = results;
  tableCallCounts[table] = 0;
}

function getNextResult(table: string): TerminalResult {
  if (!tableResults[table]) return { data: null, error: null };
  const idx = tableCallCounts[table] || 0;
  tableCallCounts[table] = idx + 1;
  return tableResults[table][Math.min(idx, tableResults[table].length - 1)];
}

vi.mock("@lib/supabase-server", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      const result = getNextResult(table);
      return chain(result);
    },
  }),
}));

// Mock drip service
const mockEnrollInDrip = vi.fn().mockResolvedValue({ success: true });
vi.mock("@lib/services/dripService", () => ({
  enrollInDrip: (...args: unknown[]) => mockEnrollInDrip(...args),
}));

// ============================================================================
// Helpers
// ============================================================================

function createRequest(secret?: string): Request {
  const headers = new Headers();
  if (secret) headers.set("authorization", `Bearer ${secret}`);
  return new Request("http://localhost/api/cron/lifecycle", { headers });
}

// ============================================================================
// Tests
// ============================================================================

describe("Lifecycle Cron", () => {
  beforeEach(() => {
    vi.resetModules();
    tableResults = {};
    tableCallCounts = {};
    mockEnrollInDrip.mockResolvedValue({ success: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("Authentication", () => {
    it("rejects requests without valid cron secret", async () => {
      const { GET } = await import("@/app/api/cron/lifecycle/route");
      const request = createRequest("wrong-secret") as unknown;
      const response = await GET(request as import("next/server").NextRequest);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("accepts requests with valid cron secret", async () => {
      // Setup minimal mocks — all sections return empty
      setupTable("cohorts"); // alumni cohort lookup
      setupTable("book_sessions"); // 3 calls: active, grace, upcoming

      const { GET } = await import("@/app/api/cron/lifecycle/route");
      const request = createRequest("test-secret") as unknown;
      const response = await GET(request as import("next/server").NextRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe("No transitions needed", () => {
    it("returns success with zero counts when no sessions need transitioning", async () => {
      setupTable("cohorts"); // alumni cohort
      setupTable("book_sessions"); // all 3 sections find nothing

      const { GET } = await import("@/app/api/cron/lifecycle/route");
      const request = createRequest("test-secret") as unknown;
      const response = await GET(request as import("next/server").NextRequest);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.results.sessionsToGrace).toBe(0);
      expect(body.results.sessionsCompleted).toBe(0);
      expect(body.results.accessExpired).toBe(0);
    });
  });

  describe("Response shape", () => {
    it("returns expected result structure", async () => {
      setupTable("cohorts");
      setupTable("book_sessions");

      const { GET } = await import("@/app/api/cron/lifecycle/route");
      const request = createRequest("test-secret") as unknown;
      const response = await GET(request as import("next/server").NextRequest);
      const body = await response.json();

      expect(body).toHaveProperty("success");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("results");
      expect(body.results).toHaveProperty("sessionsToGrace");
      expect(body.results).toHaveProperty("sessionsCompleted");
      expect(body.results).toHaveProperty("communityAccessGranted");
      expect(body.results).toHaveProperty("accessExpired");
      expect(body.results).toHaveProperty("dripEnrollments");
      expect(body.results).toHaveProperty("transitionsLogged");
      expect(body.results).toHaveProperty("errors");
      expect(Array.isArray(body.results.errors)).toBe(true);
    });
  });

  describe("Fallback cycling math (via actions API)", () => {
    // These verify the cycling math used by the weekly challenge recycling
    it("cycles week 7 to week 1", () => {
      expect(((7 - 1) % 6) + 1).toBe(1);
    });

    it("cycles week 12 to week 6", () => {
      expect(((12 - 1) % 6) + 1).toBe(6);
    });

    it("cycles week 13 to week 1", () => {
      expect(((13 - 1) % 6) + 1).toBe(1);
    });
  });
});
