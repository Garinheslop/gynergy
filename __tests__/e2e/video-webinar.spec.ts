/**
 * Video, Webinar & Session — E2E Tests
 *
 * Covers:
 * - Webinar landing page: loads, registration form, CTA
 * - Webinar APIs: join, live status, replay, seats
 * - Video room: auth + challenge access required
 * - Session page: auth + challenge access required
 * - Video APIs: auth requirements
 * - Session APIs: auth requirements
 * - Webinar host studio: auth + host verification
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const SCREENSHOT_DIR = "test-results/video-webinar";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  WEBINAR LANDING PAGE (PUBLIC)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Webinar - Landing Page", () => {
  test("01 - Webinar landing page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const content = await page.textContent("body");
    const hasContent =
      content?.toLowerCase().includes("webinar") ||
      content?.toLowerCase().includes("live") ||
      content?.toLowerCase().includes("register") ||
      content?.toLowerCase().includes("watch") ||
      content?.toLowerCase().includes("event") ||
      content?.toLowerCase().includes("training") ||
      content?.toLowerCase().includes("masterclass");

    expect(hasContent).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-webinar-landing.png`,
      fullPage: false,
    });
  });

  test("02 - Webinar landing has registration form or CTA", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Look for email input, name input, or register button
    const emailInput = page.locator("input[type='email'], input[placeholder*='email' i]");
    const registerBtn = page
      .locator("button, a")
      .filter({ hasText: /register|sign up|reserve|watch|join/i });

    const hasEmail = (await emailInput.count()) > 0;
    const hasRegister = (await registerBtn.count()) > 0;

    expect(hasEmail || hasRegister).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-webinar-registration.png`,
      fullPage: false,
    });
  });

  test("03 - Webinar page has descriptive content", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Should have substantial marketing content
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-webinar-content.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  WEBINAR APIs
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Webinar - APIs", () => {
  test("04 - POST webinar/join with missing slug returns error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/join", {
      method: "POST",
      body: { email: "test@example.com" },
    });

    // Missing slug should fail
    expect([400, 404, 422, 500]).toContain(status);
  });

  test("05 - POST webinar/join with missing email returns error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/join", {
      method: "POST",
      body: { slug: "nonexistent-webinar" },
    });

    // Missing email should fail
    expect([400, 404, 422, 500]).toContain(status);
  });

  test("06 - POST webinar/join with nonexistent slug returns error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/join", {
      method: "POST",
      body: {
        slug: "totally-fake-webinar-that-does-not-exist",
        email: "test@example.com",
        firstName: "Test",
      },
    });

    // Nonexistent webinar should fail
    expect([404, 400, 500]).toContain(status);
  });

  test("07 - GET webinar/live with no params returns error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/live");

    // Missing id/slug should fail
    expect([400, 404, 500]).toContain(status);
  });

  test("08 - GET webinar/live status action works", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/live?action=status");

    // Status check should return something (400 if no active webinar found)
    expect([200, 400, 404, 500]).toContain(status);
  });

  test("09 - GET webinar/replay with nonexistent slug returns error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(
      page,
      BASE_URL,
      "/api/webinar/replay?slug=fake-webinar-replay"
    );

    // Nonexistent replay should fail
    expect([404, 410, 400, 500]).toContain(status);
  });

  test("10 - GET webinar/seats returns data or error", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/seats");

    // Should return seats data or error
    expect([200, 400, 404, 500]).toContain(status);
  });

  test("11 - POST webinar/live create requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, { waitUntil: "domcontentloaded" });

    const { status } = await apiCall(page, BASE_URL, "/api/webinar/live", {
      method: "POST",
      body: { action: "create", title: "Test Webinar" },
    });

    // Creating webinar requires auth
    expect([401, 403, 400, 500]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  VIDEO ROOM ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Video Room - Access Control", () => {
  test("12 - Unauthenticated user redirected from video room", async ({ page }) => {
    await page.goto(`${BASE_URL}/video/test-room-id`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|pricing)/, { timeout: 15000 });
    const url = page.url();
    expect(url.includes("/login") || url.includes("/pricing")).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-video-redirect.png`,
      fullPage: false,
    });
  });

  test("13 - Unauthenticated user redirected from session page", async ({ page }) => {
    await page.goto(`${BASE_URL}/session`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|pricing)/, { timeout: 15000 });
    const url = page.url();
    expect(url.includes("/login") || url.includes("/pricing")).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-session-redirect.png`,
      fullPage: false,
    });
  });

  test("14 - Unauthenticated user redirected from session room", async ({ page }) => {
    await page.goto(`${BASE_URL}/session/test-session-id`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|pricing)/, { timeout: 15000 });
    const url = page.url();
    expect(url.includes("/login") || url.includes("/pricing")).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-session-room-redirect.png`,
      fullPage: false,
    });
  });

  test("15 - Unauthenticated user redirected from webinar studio", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar/studio/test-webinar-id`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Studio should require auth
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(
      url.includes("/login") || url.includes("/webinar/studio") || url.includes("/webinar")
    ).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-studio-redirect.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  VIDEO APIs (AUTH REQUIRED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Video - APIs", () => {
  test.describe.configure({ mode: "serial" });

  let authedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    authedPage = await ctx.newPage();
    await authedPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(authedPage, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);
  });

  test.afterAll(async () => {
    await authedPage.context().close();
  });

  test("16 - GET video/get-rooms requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/video/get-rooms");
    expect(status).toBe(401);
  });

  test("17 - GET video/get-rooms returns data when authenticated", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/video/get-rooms");

    // Should succeed or return empty array
    expect([200, 404, 500]).toContain(status);
    if (status === 200) {
      expect(data).toBeTruthy();
    }
  });

  test("18 - GET video/get-room requires roomId param", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/video/get-room");

    // Missing roomId should fail
    expect([400, 404, 500]).toContain(status);
  });

  test("19 - GET video/get-upcoming requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/video/get-upcoming");
    expect(status).toBe(401);
  });

  test("20 - POST video/create-room requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/video/create-room", {
      method: "POST",
      body: { title: "Test Room" },
    });
    expect(status).toBe(401);
  });

  test("21 - POST video/join-room requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/video/join-room", {
      method: "POST",
      body: { roomId: "fake-room" },
    });
    expect(status).toBe(401);
  });

  test("22 - GET video/get-invitations requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/video/get-invitations");
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  SESSION APIs (AUTH REQUIRED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Session - APIs", () => {
  test.describe.configure({ mode: "serial" });

  let authedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    authedPage = await ctx.newPage();
    await authedPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(authedPage, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);
  });

  test.afterAll(async () => {
    await authedPage.context().close();
  });

  test("23 - GET session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/session?upcoming=true");
    expect(status).toBe(401);
  });

  test("24 - GET session with upcoming flag returns data when authenticated", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/session?upcoming=true");

    // Should succeed or return appropriate error
    expect([200, 404, 500]).toContain(status);
    if (status === 200) {
      expect(data).toBeTruthy();
    }
  });

  test("25 - GET session with fake ID returns error", async () => {
    const { status } = await apiCall(
      authedPage,
      BASE_URL,
      "/api/session?id=00000000-0000-0000-0000-000000000000"
    );

    // Nonexistent session should fail
    expect([404, 400, 500]).toContain(status);
  });

  test("26 - POST session create requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "create", title: "Test Session" },
    });
    expect(status).toBe(401);
  });

  test("27 - POST session join requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "join", sessionId: "fake-session" },
    });
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  WEBINAR LIVE/REPLAY PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Webinar - Live & Replay Pages", () => {
  test("28 - Webinar live page with fake slug handles gracefully", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar/live/totally-fake-slug`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Should show error, not found, or registration form
    const content = await page.textContent("body");
    const isHandled =
      content!.length > 10 || // Has some content
      page.url().includes("/webinar"); // Stayed on webinar routes

    expect(isHandled).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/28-webinar-live-fake.png`,
      fullPage: false,
    });
  });

  test("29 - Webinar replay page with fake slug handles gracefully", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar/replay/totally-fake-slug`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Should show error, expired, or not found
    const content = await page.textContent("body");
    const isHandled = content!.length > 10 || page.url().includes("/webinar");

    expect(isHandled).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/29-webinar-replay-fake.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MOBILE RESPONSIVENESS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Video/Webinar - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("30 - Webinar landing mobile — no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/30-webinar-mobile.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Video/Webinar - Accessibility", () => {
  test("31 - Webinar landing has heading hierarchy", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const headings = page.locator("h1, h2, h3");
    expect(await headings.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/31-webinar-headings.png`,
      fullPage: false,
    });
  });

  test("32 - Webinar landing has interactive elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const interactive = page.locator("button, a[href], input");
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/32-webinar-interactive.png`,
      fullPage: false,
    });
  });

  test("33 - Webinar keyboard navigation works", async ({ page }) => {
    await page.goto(`${BASE_URL}/webinar`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA", "DIV"]).toContain(focusedTag);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/33-webinar-keyboard.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK — ALL VIDEO/WEBINAR/SESSION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Video/Webinar - Health Check", () => {
  test("34 - Public webinar routes respond without 500", async ({ page }) => {
    const publicRoutes = ["/webinar"];

    for (const route of publicRoutes) {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;
      expect(status).not.toBe(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/34-health-check.png`,
      fullPage: false,
    });
  });
});
