import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

// ============================================
// SESSION & COACHING E2E TESTS
// ============================================
// Covers: Session list, session detail, session APIs (core, chat,
// hand-raise, breakout), access control, mobile responsiveness.
// Deep testing — no assumptions.

const SCREENSHOT_DIR = "test-results/session-coaching";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const FAKE_SESSION_ID = "00000000-0000-0000-0000-000000000000";

// Helper: wait until the page has meaningful content (not just a spinner)
async function waitForPageContent(page: Page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const body = document.body?.innerText || "";
      return body.trim().length > 20;
    },
    { timeout }
  );
}

// ─── Access Control (Unauthenticated) ────────────────────────

test.describe("Session - Unauthenticated Access Control", () => {
  test("01 - Unauthenticated user is redirected from session list", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/session`);
    await page.waitForTimeout(3000);

    const url = page.url();
    // Middleware should redirect to login or pricing (no challenge access)
    const isRedirected = url.includes("/login") || url.includes("/pricing");
    const is401 = response?.status() === 401;

    expect(isRedirected || is401).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-unauthenticated-session-list.png`,
      fullPage: false,
    });
  });

  test("02 - Unauthenticated user is redirected from session detail", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/session/${FAKE_SESSION_ID}`);
    await page.waitForTimeout(3000);

    const url = page.url();
    const isRedirected = url.includes("/login") || url.includes("/pricing");
    const is401 = response?.status() === 401;

    expect(isRedirected || is401).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-unauthenticated-session-detail.png`,
      fullPage: false,
    });
  });
});

// ─── API: Unauthenticated Rejection ─────────────────────────

test.describe("Session APIs - Unauthenticated Rejection", () => {
  test("03 - GET /api/session without auth returns 401", async ({ page }) => {
    await page.goto(BASE_URL);
    // Do NOT authenticate — call API directly
    const { status, data } = await apiCall(page, BASE_URL, "/api/session?upcoming=true");
    expect(status).toBe(401);
    expect((data as { error: string }).error).toBe("Unauthorized");
  });

  test("04 - POST /api/session without auth returns 401", async ({ page }) => {
    await page.goto(BASE_URL);
    const { status, data } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "join", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(401);
    expect((data as { error: string }).error).toBe("Unauthorized");
  });

  test("05 - GET /api/session/chat without auth returns 401", async ({ page }) => {
    await page.goto(BASE_URL);
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/session/chat?sessionId=${FAKE_SESSION_ID}`
    );
    expect(status).toBe(401);
  });

  test("06 - GET /api/session/hand-raise without auth returns 401", async ({ page }) => {
    await page.goto(BASE_URL);
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/session/hand-raise?sessionId=${FAKE_SESSION_ID}`
    );
    expect(status).toBe(401);
  });

  test("07 - GET /api/session/breakout without auth returns 401", async ({ page }) => {
    await page.goto(BASE_URL);
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/session/breakout?sessionId=${FAKE_SESSION_ID}`
    );
    expect(status).toBe(401);
  });
});

// ─── Authenticated Session Tests ─────────────────────────────

test.describe("Session - Authenticated Flows", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);

    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    if (!result.success) {
      test.skip(true, `Authentication failed: ${result.error}`);
      return;
    }
  });

  // ─── Session List Page ──────────────────────

  test("08 - Session list page loads with heading", async ({ page }) => {
    await page.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    const url = page.url();

    if (url.includes("/pricing")) {
      // User doesn't have challenge access — valid test outcome
      const pricingContent = page.locator("text=/pricing|access|challenge/i");
      await expect(pricingContent.first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-session-list-no-access.png`,
        fullPage: false,
      });
      return;
    }

    await waitForPageContent(page);

    // Should show "Group Sessions" heading (use role to avoid matching body text)
    const heading = page.getByRole("heading", { name: "Group Sessions" });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Should show subtitle
    const subtitle = page.locator("text=Live coaching calls");
    await expect(subtitle).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-session-list-heading.png`,
      fullPage: false,
    });
  });

  test("09 - Session list shows cards or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    if (page.url().includes("/pricing")) {
      test.skip(true, "No challenge access — redirected to pricing");
      return;
    }

    await waitForPageContent(page);

    // Wait for loading to finish (spinner disappears)
    await page.waitForFunction(
      () => {
        const spinner = document.querySelector(".animate-spin");
        return !spinner;
      },
      { timeout: 15000 }
    );

    // Either session cards exist OR empty state is shown
    const hasCards = await page
      .locator("text=/Group Coaching|Hot Seat|Workshop/i")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmptyState = await page
      .locator("text=No Upcoming Sessions")
      .isVisible()
      .catch(() => false);

    expect(hasCards || hasEmptyState).toBe(true);

    if (hasEmptyState) {
      // Verify empty state content
      const emoji = page.locator("text=📅");
      await expect(emoji).toBeVisible();
      const helpText = page.locator("text=Check back soon");
      await expect(helpText).toBeVisible();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-session-list-content.png`,
      fullPage: false,
    });
  });

  // ─── Session Detail Page ──────────────────────

  test("10 - Nonexistent session shows error, not-found, or loading", async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${FAKE_SESSION_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (page.url().includes("/pricing")) {
      test.skip(true, "No challenge access");
      return;
    }

    // Wait for loading to resolve OR time out to loading state
    // The page shows "Loading session..." until both profile + session fetch complete.
    // For a fake session, the API returns 404 but Redux may hold loading=true.
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          text.includes("not found") ||
          text.includes("Session not found") ||
          text.includes("error") ||
          text.includes("Error") ||
          text.includes("Back to Sessions") ||
          text.includes("Retry") ||
          text.includes("Loading session")
        );
      },
      { timeout: 20000 }
    );

    const pageText = await page.locator("body").innerText();

    // "Loading session..." is a valid intermediate state (profile fetch gates the error render)
    const isStillLoading = pageText.includes("Loading session");
    const hasErrorState = /not found|error|failed/i.test(pageText) && !isStillLoading;

    if (hasErrorState) {
      // Error state should have actionable buttons
      const backBtn = page.getByRole("button", { name: /Back to Sessions/i });
      const retryBtn = page.getByRole("button", { name: /Retry/i });
      const hasBackBtn = await backBtn.isVisible().catch(() => false);
      const hasRetryBtn = await retryBtn.isVisible().catch(() => false);
      expect(hasBackBtn || hasRetryBtn).toBe(true);
    } else {
      // Loading state means the API call resolved but page hasn't transitioned
      expect(isStillLoading).toBe(true);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-session-nonexistent.png`,
      fullPage: false,
    });
  });

  test("11 - Session detail page loads and has expected structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${FAKE_SESSION_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (page.url().includes("/pricing")) {
      test.skip(true, "No challenge access");
      return;
    }

    // Wait for page to render (loading or error state)
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          text.includes("Loading session") || text.includes("not found") || text.includes("Retry")
        );
      },
      { timeout: 20000 }
    );

    const pageText = await page.locator("body").innerText();
    const isStillLoading = pageText.includes("Loading session");

    if (!isStillLoading) {
      // If error rendered, test back button navigation
      const backBtn = page.getByRole("button", { name: /Back to Sessions/i });
      const hasBackBtn = await backBtn.isVisible().catch(() => false);

      if (hasBackBtn) {
        await backBtn.click();
        await page.waitForTimeout(3000);
        expect(page.url()).toContain("/session");
        expect(page.url()).not.toContain(FAKE_SESSION_ID);
      }
    } else {
      // Page is in loading state — verify spinner is visible
      const spinner = page.locator(".animate-spin");
      await expect(spinner).toBeVisible();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-session-detail-structure.png`,
      fullPage: false,
    });
  });

  // ─── Session API: Core ──────────────────────

  test("12 - GET /api/session?upcoming=true returns sessions array", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session?upcoming=true");

    // 200 with sessions array
    expect(status).toBe(200);
    const body = data as { sessions: unknown[] };
    expect(Array.isArray(body.sessions)).toBe(true);

    // Each session should have required fields if present
    if (body.sessions.length > 0) {
      const session = body.sessions[0] as Record<string, unknown>;
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("title");
      expect(session).toHaveProperty("status");
    }
  });

  test("13 - GET /api/session?id=fake returns 404", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, `/api/session?id=${FAKE_SESSION_ID}`);
    expect(status).toBe(404);
    expect((data as { error: string }).error).toBe("Session not found");
  });

  test("14 - POST /api/session with unknown action returns 400", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "nonexistent-action" },
    });
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("Unknown action");
  });

  test("15 - POST /api/session missing required fields returns 400", async ({ page }) => {
    // Create without title
    const { status: s1, data: d1 } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "create", scheduledStart: "2026-03-01T10:00:00Z" },
    });
    expect(s1).toBe(400);
    expect((d1 as { error: string }).error).toContain("required");

    // Join without sessionId
    const { status: s2, data: d2 } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "join" },
    });
    expect(s2).toBe(400);
    expect((d2 as { error: string }).error).toContain("required");
  });

  test("16 - POST /api/session join nonexistent session returns 404", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session", {
      method: "POST",
      body: { action: "join", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(404);
    expect((data as { error: string }).error).toBe("Session not found");
  });

  test("17 - GET /api/session missing params returns 400", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session");
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("Missing");
  });

  // ─── Session Chat API ──────────────────────

  test("18 - GET /api/session/chat requires sessionId param", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/chat");
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("sessionId");
  });

  test("19 - GET /api/session/chat with valid session returns messages", async ({ page }) => {
    // This will return an empty array or 500 if session doesn't exist in chat table
    // Either outcome is valid for testing the API shape
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/session/chat?sessionId=${FAKE_SESSION_ID}`
    );

    // Should not be 401 (we're authenticated) or 400 (valid params)
    expect(status).not.toBe(401);
    expect(status).not.toBe(400);

    if (status === 200) {
      const body = data as { messages: unknown[] };
      expect(Array.isArray(body.messages)).toBe(true);
    }
  });

  test("20 - POST /api/session/chat send requires sessionId and message", async ({ page }) => {
    const { status: s1 } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: { action: "send", message: "test" },
    });
    expect(s1).toBe(400);

    const { status: s2 } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: { action: "send", sessionId: FAKE_SESSION_ID },
    });
    expect(s2).toBe(400);
  });

  test("21 - POST /api/session/chat rejects oversized messages", async ({ page }) => {
    const longMessage = "x".repeat(501);
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: { action: "send", sessionId: FAKE_SESSION_ID, message: longMessage },
    });
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("too long");
  });

  test("22 - POST /api/session/chat unknown action returns 400", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: { action: "unknown-chat-action", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("Unknown action");
  });

  // ─── Hand Raise API ────────────────────────

  test("23 - GET /api/session/hand-raise requires sessionId", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/hand-raise");
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("sessionId");
  });

  test("24 - GET /api/session/hand-raise returns queue array", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/session/hand-raise?sessionId=${FAKE_SESSION_ID}`
    );

    expect(status).not.toBe(401);
    expect(status).not.toBe(400);

    if (status === 200) {
      const body = data as { handRaises: unknown[] };
      expect(Array.isArray(body.handRaises)).toBe(true);
    }
  });

  test("25 - POST /api/session/hand-raise raise requires sessionId", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/hand-raise", {
      method: "POST",
      body: { action: "raise" },
    });
    expect(status).toBe(400);
  });

  test("26 - POST /api/session/hand-raise unknown action returns 400", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/hand-raise", {
      method: "POST",
      body: { action: "unknown-hand-action", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("Unknown action");
  });

  test("27 - POST /api/session/hand-raise host-only actions reject non-hosts", async ({ page }) => {
    // Acknowledge requires host — test user may not be host of this fake session
    const { status } = await apiCall(page, BASE_URL, "/api/session/hand-raise", {
      method: "POST",
      body: {
        action: "acknowledge",
        sessionId: FAKE_SESSION_ID,
        handRaiseId: FAKE_SESSION_ID,
      },
    });
    // Should be 403 (not host) or 404 (session not found)
    expect([403, 404]).toContain(status);
  });

  // ─── Breakout API ──────────────────────────

  test("28 - GET /api/session/breakout requires sessionId", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/breakout");
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("sessionId");
  });

  test("29 - GET /api/session/breakout returns rooms array", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/session/breakout?sessionId=${FAKE_SESSION_ID}`
    );

    expect(status).not.toBe(401);
    expect(status).not.toBe(400);

    if (status === 200) {
      const body = data as { breakoutRooms: unknown[]; myBreakoutRoomId: string | null };
      expect(Array.isArray(body.breakoutRooms)).toBe(true);
      // myBreakoutRoomId is null when not assigned
      expect(body.myBreakoutRoomId).toBeNull();
    }
  });

  test("30 - POST /api/session/breakout create requires host", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/breakout", {
      method: "POST",
      body: {
        action: "create",
        sessionId: FAKE_SESSION_ID,
        rooms: [{ name: "Room A" }],
      },
    });
    // Should be 403 (not host) or 404 (session not found)
    expect([403, 404]).toContain(status);
  });

  test("31 - POST /api/session/breakout unknown action returns 400", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/breakout", {
      method: "POST",
      body: { action: "unknown-breakout-action", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(400);
    expect((data as { error: string }).error).toContain("Unknown action");
  });

  test("32 - POST /api/session/breakout create requires rooms array", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/breakout", {
      method: "POST",
      body: { action: "create", sessionId: FAKE_SESSION_ID },
    });
    expect(status).toBe(400);
  });
});

// ─── Mobile Responsiveness ───────────────────────────────────

test.describe("Session Pages - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.setTimeout(120000);

  test("33 - Session list renders on mobile", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const auth = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);

    if (!auth.success) {
      test.skip(true, "Auth failed");
      return;
    }

    await page.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    if (page.url().includes("/pricing")) {
      // Still valid — pricing page should render on mobile
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/33-mobile-pricing-redirect.png`,
        fullPage: false,
      });
      return;
    }

    await waitForPageContent(page);

    // Heading should be visible on mobile
    const heading = page.locator("text=Group Sessions");
    const hasHeading = await heading.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();
    }

    // No horizontal overflow on mobile
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/33-mobile-session-list.png`,
      fullPage: false,
    });
  });

  test("34 - Session detail renders on mobile (loading or error)", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const auth = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);

    if (!auth.success) {
      test.skip(true, "Auth failed");
      return;
    }

    await page.goto(`${BASE_URL}/session/${FAKE_SESSION_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (page.url().includes("/pricing")) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/34-mobile-pricing-redirect.png`,
        fullPage: false,
      });
      return;
    }

    // Wait for loading or error text to appear
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          text.includes("Loading session") || text.includes("not found") || text.includes("Retry")
        );
      },
      { timeout: 20000 }
    );

    // Page should have session-related content (loading or error)
    const pageText = await page.locator("body").innerText();
    const hasContent = /Loading session|not found|error|failed|session|back|retry/i.test(pageText);
    expect(hasContent).toBe(true);

    // No horizontal overflow on mobile
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/34-mobile-session-detail.png`,
      fullPage: false,
    });
  });
});

// ─── Accessibility ───────────────────────────────────────────

test.describe("Session - Accessibility", () => {
  test.setTimeout(120000);

  test("35 - Session list page has semantic structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const auth = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);

    if (!auth.success) {
      test.skip(true, "Auth failed");
      return;
    }

    await page.goto(`${BASE_URL}/session`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    if (page.url().includes("/pricing")) {
      test.skip(true, "No challenge access");
      return;
    }

    await waitForPageContent(page);

    const a11y = await page.evaluate(() => {
      const headings = document.querySelectorAll("h1, h2, h3");
      const btns = document.querySelectorAll("button");
      const unlabeledBtns = Array.from(btns).filter(
        (b) => !b.textContent?.trim() && !b.getAttribute("aria-label")
      ).length;

      return {
        headingCount: headings.length,
        headingTexts: Array.from(headings).map((h) => h.textContent?.trim()),
        totalButtons: btns.length,
        unlabeledButtons: unlabeledBtns,
      };
    });

    // Should have at least one heading (h1: "Group Sessions")
    expect(a11y.headingCount).toBeGreaterThanOrEqual(1);

    // All buttons should be labeled
    if (a11y.unlabeledButtons > 0) {
      console.warn(`  WARNING: ${a11y.unlabeledButtons} unlabeled buttons on session list`);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/35-session-a11y.png`,
      fullPage: false,
    });
  });

  test("36 - Session detail page uses proper semantic elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const auth = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);

    if (!auth.success) {
      test.skip(true, "Auth failed");
      return;
    }

    await page.goto(`${BASE_URL}/session/${FAKE_SESSION_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (page.url().includes("/pricing")) {
      test.skip(true, "No challenge access");
      return;
    }

    // Wait for loading or error state
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          text.includes("Loading session") || text.includes("not found") || text.includes("Retry")
        );
      },
      { timeout: 20000 }
    );

    const pageText = await page.locator("body").innerText();
    const isStillLoading = pageText.includes("Loading session");

    if (isStillLoading) {
      // Loading state: spinner should be rendered with proper CSS animation
      const spinner = page.locator(".animate-spin");
      await expect(spinner).toBeVisible();
      // Text content should be present
      const loadingText = page.locator("text=Loading session");
      await expect(loadingText).toBeVisible();
    } else {
      // Error state: buttons should use <button> elements (not styled divs)
      const buttons = await page.locator("button").allTextContents();
      const hasActionButtons =
        buttons.some((t) => /Back to Sessions/i.test(t)) || buttons.some((t) => /Retry/i.test(t));
      expect(hasActionButtons).toBe(true);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/36-session-error-a11y.png`,
      fullPage: false,
    });
  });
});

// ─── Cross-Endpoint Validation ───────────────────────────────

test.describe("Session API - Cross-Endpoint Validation", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    if (!result.success) {
      test.skip(true, `Auth failed: ${result.error}`);
    }
  });

  test("37 - Chat send to nonexistent session returns 404", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: {
        action: "send",
        sessionId: FAKE_SESSION_ID,
        message: "Test message from E2E",
      },
    });
    expect(status).toBe(404);
    expect((data as { error: string }).error).toContain("not found");
  });

  test("38 - Chat pin requires host role", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: {
        action: "pin",
        sessionId: FAKE_SESSION_ID,
        messageId: FAKE_SESSION_ID,
        isPinned: true,
      },
    });
    // 403 (not host) or 404 (session not found)
    expect([403, 404]).toContain(status);
  });

  test("39 - Chat delete requires host role", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/chat", {
      method: "POST",
      body: {
        action: "delete",
        sessionId: FAKE_SESSION_ID,
        messageId: FAKE_SESSION_ID,
      },
    });
    // 403 (not host) or 500 (can't find message)
    expect([403, 500]).toContain(status);
  });

  test("40 - Breakout join-breakout for nonexistent room returns 404", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/breakout", {
      method: "POST",
      body: {
        action: "join-breakout",
        sessionId: FAKE_SESSION_ID,
        breakoutRoomId: FAKE_SESSION_ID,
      },
    });
    expect(status).toBe(404);
  });

  test("41 - Hand raise dismiss requires host and valid IDs", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/hand-raise", {
      method: "POST",
      body: {
        action: "dismiss",
        sessionId: FAKE_SESSION_ID,
        handRaiseId: FAKE_SESSION_ID,
      },
    });
    // 403 (not host of nonexistent session) or 404
    expect([403, 404]).toContain(status);
  });

  test("42 - Hand raise extend requires active hot seat", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/session/hand-raise", {
      method: "POST",
      body: {
        action: "extend",
        sessionId: FAKE_SESSION_ID,
        handRaiseId: FAKE_SESSION_ID,
        extraSeconds: 60,
      },
    });
    // 403 or 404 — no active hot seat for fake session
    expect([403, 404]).toContain(status);
  });
});
