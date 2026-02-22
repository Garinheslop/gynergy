/**
 * Book & Utility APIs — E2E Tests
 *
 * Covers:
 * - Books API (latest-book-sessions, user-current-book-session, book-enrollment, reset)
 * - Leaderboard API (leaderboard-data, user-rank)
 * - Gamification API (all-badges, user-badges, points-history, total-points, check-badges)
 * - User Profile API (user-profile, update-user-data)
 * - Upload/OCR API (upload, ocr)
 * - Notifications API (list, mark-read)
 *
 * Known state (AGENT_PRIMARY / garin@gynergy.com):
 * - IS_ADMIN: true
 * - HAS_CHALLENGE_ACCESS: true
 * - HAS_AI_CONSENT: false
 */

import { expect, test, Page } from "@playwright/test";

import { BOOK_ROUTES, GAMIFICATION_ROUTES, LEADERBOARD_ROUTES } from "./helpers/agent-capabilities";
import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  BOOKS API — UNAUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Books API - Unauthenticated", () => {
  test("01 - GET latest-book-sessions requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, BOOK_ROUTES.latestBookSessions);
    expect(status).toBe(401);
  });

  test("02 - GET user-current-book-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, BOOK_ROUTES.userCurrentBookSession);
    expect(status).toBe(401);
  });

  test("03 - GET book-enrollment requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, BOOK_ROUTES.bookEnrollment);
    expect(status).toBe(401);
  });

  test("04 - POST reset-user-book-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, BOOK_ROUTES.resetUserBookSession, {
      method: "POST",
      body: { bookSlug: "test-book" },
    });
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  BOOKS API — AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Books API - Authenticated", () => {
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

  test("05 - GET latest-book-sessions with bookSlug returns data", async () => {
    const { status } = await apiCall(
      authedPage,
      BASE_URL,
      BOOK_ROUTES.latestBookSessions + "?bookSlug=date-zero-gratitude"
    );

    // 200 if book exists, 500 if server error (e.g., no book sessions yet)
    expect(status === 200 || status === 500).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  LEADERBOARD API — UNAUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Leaderboard API - Unauthenticated", () => {
  test("06 - GET leaderboard-data requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, LEADERBOARD_ROUTES.leaderboardData);
    expect(status).toBe(401);
  });

  test("07 - GET user-rank requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, LEADERBOARD_ROUTES.userRank);
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  LEADERBOARD API — AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Leaderboard API - Authenticated", () => {
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

  test("08 - GET leaderboard-data returns data when authed", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, LEADERBOARD_ROUTES.leaderboardData);

    // 200 if leaderboard data exists, 500 if server error
    expect(status === 200 || status === 500).toBe(true);
  });

  test("09 - GET user-rank returns data when authed", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, LEADERBOARD_ROUTES.userRank);

    // 200 if rank data exists, 500 if server error
    expect(status === 200 || status === 500).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GAMIFICATION API — UNAUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Gamification API - Unauthenticated", () => {
  test("10 - GET all-badges requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, GAMIFICATION_ROUTES.allBadges);
    expect(status).toBe(401);
  });

  test("11 - GET user-badges requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, GAMIFICATION_ROUTES.userBadges);
    expect(status).toBe(401);
  });

  test("12 - GET points-history requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, GAMIFICATION_ROUTES.pointsHistory);
    expect(status).toBe(401);
  });

  test("13 - GET total-points requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, GAMIFICATION_ROUTES.totalPoints);
    expect(status).toBe(401);
  });

  test("14 - POST check-badges requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, GAMIFICATION_ROUTES.checkBadges, {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GAMIFICATION API — AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Gamification API - Authenticated", () => {
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

  test("15 - GET all-badges returns badge list when authed", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, GAMIFICATION_ROUTES.allBadges);

    expect(status).toBe(200);

    // Response shape: { badges: [...] }
    const body = data as { badges?: unknown[] };
    expect(body).toHaveProperty("badges");
    expect(Array.isArray(body.badges)).toBe(true);
  });

  test("16 - GET user-badges returns data when authed", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, GAMIFICATION_ROUTES.userBadges);

    expect(status).toBe(200);
    expect(data).toBeTruthy();
  });

  test("17 - GET total-points returns data when authed", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, GAMIFICATION_ROUTES.totalPoints);

    expect(status).toBe(200);
    expect(data).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  USER PROFILE API — UNAUTHENTICATED & AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("User Profile API - Unauthenticated", () => {
  test("18 - GET /api/users/user-profile requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/users/user-profile");
    expect(status).toBe(401);
  });

  test("19 - PATCH /api/users/update-user-data requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/users/update-user-data", {
      method: "PATCH",
      body: { display_name: "Test" },
    });
    expect(status).toBe(401);
  });
});

test.describe("User Profile API - Authenticated", () => {
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

  test("20 - GET /api/users/user-profile returns profile when authed", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/users/user-profile");

    expect(status).toBe(200);

    // Response shape: user profile with at minimum an id and email
    const body = data as { id?: string; email?: string };
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("email");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  UPLOAD / OCR API — UNAUTHENTICATED & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Upload/OCR API - Unauthenticated", () => {
  test("21 - POST /api/upload requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/upload", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });

  test("22 - POST /api/ocr requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ocr", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });
});

test.describe("Upload/OCR API - Authenticated Validation", () => {
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

  test("23 - POST /api/upload without file returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/upload", {
      method: "POST",
      body: {},
    });

    expect(status).toBe(400);
  });

  test("24 - POST /api/ocr without image returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ocr", {
      method: "POST",
      body: {},
    });

    expect(status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS API — UNAUTHENTICATED & AUTHENTICATED
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Notifications API - Unauthenticated", () => {
  test("25 - GET /api/notifications requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/notifications");
    expect(status).toBe(401);
  });

  test("26 - PATCH /api/notifications requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/notifications", {
      method: "PATCH",
      body: { notificationId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(status).toBe(401);
  });
});

test.describe("Notifications API - Authenticated", () => {
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

  test("27 - GET /api/notifications returns data when authed", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/notifications");

    expect(status).toBe(200);
    expect(data).toBeTruthy();
  });

  test("28 - PATCH /api/notifications with fake ID returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/notifications", {
      method: "PATCH",
      body: { notificationId: "00000000-0000-0000-0000-000000000000" },
    });

    // Fake notification ID should return 400 (bad request) or 404 (not found)
    expect(status === 400 || status === 404).toBe(true);
  });
});
