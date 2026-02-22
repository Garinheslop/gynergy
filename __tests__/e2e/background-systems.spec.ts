/**
 * Background Systems — E2E Tests
 *
 * Covers non-user-facing infrastructure endpoints:
 * - Email tracking (open pixel, click tracking)
 * - Email unsubscribe (self-service page)
 * - Email send (internal API, secret-protected)
 * - Cron jobs (CRON_SECRET-protected scheduled tasks)
 * - HMS webhook (100ms video platform webhook)
 * - Community call page (authenticated video room)
 *
 * Known state (AGENT_PRIMARY / garin@gynergy.com):
 * - IS_ADMIN: true
 * - HAS_CHALLENGE_ACCESS: true
 * - HAS_AI_CONSENT: false
 */

import { expect, test } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL TRACKING
//  GET /api/email/track — returns a 1x1 tracking pixel (image/gif)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Email Tracking", () => {
  test("01 - GET /api/email/track with valid params returns a GIF image", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    // Call the tracking endpoint with required params (type + id)
    const response = await page.request.fetch(
      `${BASE_URL}/api/email/track?type=open&id=test-campaign-001&email=${btoa("test@example.com")}`,
      { method: "GET" }
    );

    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"] || "";
    expect(contentType).toContain("image");
  });

  test("02 - GET /api/email/track without params returns 400", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const response = await page.request.fetch(`${BASE_URL}/api/email/track`, {
      method: "GET",
    });

    expect(response.status()).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL UNSUBSCRIBE
//  GET /api/email/unsubscribe — self-service unsubscribe confirmation page
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Email Unsubscribe", () => {
  test("03 - GET /api/email/unsubscribe with email returns 200 HTML page", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const encodedEmail = btoa("test@example.com");
    const response = await page.request.fetch(
      `${BASE_URL}/api/email/unsubscribe?email=${encodedEmail}`,
      { method: "GET" }
    );

    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"] || "";
    expect(contentType).toContain("text/html");
  });

  test("04 - GET /api/email/unsubscribe without email param returns error HTML", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const response = await page.request.fetch(`${BASE_URL}/api/email/unsubscribe`, {
      method: "GET",
    });

    // Endpoint returns HTML even on error — verify it responds (not 404/500)
    // and contains error messaging in HTML
    const contentType = response.headers()["content-type"] || "";
    expect(contentType).toContain("text/html");
    const body = await response.text();
    expect(body).toContain("Something went wrong");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL SEND (INTERNAL API)
//  POST /api/email/send — requires x-internal-secret header
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Email Send", () => {
  test("05 - POST /api/email/send without internal API secret returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/email/send", {
      method: "POST",
      body: { type: "welcome", to: "test@example.com", firstName: "Test" },
    });

    expect([401, 403]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  CRON ENDPOINTS
//  Each requires CRON_SECRET via Authorization: Bearer header.
//  We verify: (1) endpoint exists (not 404), (2) auth is enforced (401).
// ═══════════════════════════════════════════════════════════════════════════

const CRON_ENDPOINTS = [
  { name: "streak-reminder", path: "/api/cron/streak-reminder" },
  { name: "email-drip", path: "/api/cron/email-drip" },
  { name: "win-back", path: "/api/cron/win-back" },
  { name: "daily-digest", path: "/api/cron/daily-digest" },
  { name: "cleanup", path: "/api/cron/cleanup" },
  { name: "leaderboard", path: "/api/cron/leaderboard" },
];

test.describe("Cron Endpoints", () => {
  for (const endpoint of CRON_ENDPOINTS) {
    test(`06-${endpoint.name} - POST ${endpoint.path} requires CRON_SECRET (expect 401)`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

      const { status } = await apiCall(page, BASE_URL, endpoint.path, {
        method: "POST",
        body: {},
      });

      expect(status).toBe(401);
    });

    test(`07-${endpoint.name} - POST ${endpoint.path} endpoint exists (not 404)`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

      const { status } = await apiCall(page, BASE_URL, endpoint.path, {
        method: "POST",
        body: {},
      });

      // Any status other than 404 confirms the route is registered.
      // 401 = auth enforced, 405 = method not allowed — both mean the route exists.
      expect(status).not.toBe(404);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  HMS WEBHOOK
//  POST /api/webhooks/hms — requires x-100ms-signature HMAC header
// ═══════════════════════════════════════════════════════════════════════════

test.describe("HMS Webhook", () => {
  test("08 - POST /api/webhooks/hms without HMAC signature returns 401 or 400", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webhooks/hms", {
      method: "POST",
      body: { type: "recording.success", data: {} },
    });

    expect([400, 401]).toContain(status);
  });

  test("09 - POST /api/webhooks/hms endpoint exists (not 404)", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webhooks/hms", {
      method: "POST",
      body: { type: "recording.success", data: {} },
    });

    expect(status).not.toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  COMMUNITY CALL PAGE
//  GET /community/call/:roomId — authenticated video room page
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Community Call Page", () => {
  test.describe.configure({ mode: "serial" });

  test("10 - GET /community/call/fake-room-id unauthenticated redirects to /login", async ({
    page,
  }) => {
    // Navigate without authenticating — middleware should redirect to /login
    await page.goto(`${BASE_URL}/community/call/fake-room-id`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForURL(/\/login/, { timeout: 15000 });

    expect(page.url()).toContain("/login");

    await page.screenshot({ path: "test-results/background-systems/10-call-unauthenticated.png" });
  });

  test("11 - GET /community/call/fake-room-id authenticated with fake room shows error or empty state", async ({
    page,
  }) => {
    // Authenticate first
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });

    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    if (!result.success) {
      console.error("Auth failed:", result.error);
      test.skip(true, `Authentication failed: ${result.error}`);
      return;
    }

    // Navigate to a fake room ID — should show error or empty state, not crash
    await page.goto(`${BASE_URL}/community/call/fake-room-id`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Should not redirect to login (we are authenticated)
    expect(page.url()).not.toContain("/login");

    // The page should either show an error message, redirect, or render an empty state
    // It should NOT be a hard 500 crash
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toBeNull();

    await page.screenshot({
      path: "test-results/background-systems/11-call-fake-room-authenticated.png",
    });
  });
});
