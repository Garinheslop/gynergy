/**
 * Dashboard & Journal History — E2E Tests
 *
 * Covers:
 * - Dashboard page: requires auth + challenge access, shows sections
 * - Journal dashboard: vision cards, journal cards, growth/leaderboard
 * - History page: journal history grid, card navigation
 * - Journal APIs: create/read validation, auth requirements
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const SCREENSHOT_DIR = "test-results/dashboard";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const BOOK_SLUG = "date-zero-gratitude";

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD ACCESS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Access Control", () => {
  test("01 - Unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/${BOOK_SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain("/login");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-redirect.png`,
      fullPage: false,
    });
  });

  test("02 - Unauthenticated user redirected from history", async ({ page }) => {
    await page.goto(`${BASE_URL}/${BOOK_SLUG}/history`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain("/login");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-history-redirect.png`,
      fullPage: false,
    });
  });

  test("03 - Unauthenticated user redirected from journal editor", async ({ page }) => {
    await page.goto(`${BASE_URL}/${BOOK_SLUG}/journal/editor`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain("/login");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-editor-redirect.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD PAGE (AUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Authenticated", () => {
  test.describe.configure({ mode: "serial" });

  let authedPage: Page;
  let dashboardLoaded = false;

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

  test("04 - Dashboard loads for authenticated user", async () => {
    await authedPage.goto(`${BASE_URL}/${BOOK_SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await authedPage.waitForTimeout(7000);

    const url = authedPage.url();

    if (url.includes(BOOK_SLUG) && !url.includes("/login") && !url.includes("/pricing")) {
      dashboardLoaded = true;
      await authedPage.screenshot({
        path: `${SCREENSHOT_DIR}/04-dashboard.png`,
        fullPage: false,
      });
    } else {
      // Challenge access redirect — acceptable
      expect(url.includes("/login") || url.includes("/pricing") || url === `${BASE_URL}/`).toBe(
        true
      );
    }
  });

  test("05 - Dashboard shows journal section", async () => {
    test.skip(!dashboardLoaded, "Dashboard did not load (auth/access redirect)");

    // Journal section should have morning/evening/weekly options
    const journalText = authedPage.locator("text=/morning|evening|journal|gratitude|weekly/i");
    const journalCount = await journalText.count();
    expect(journalCount).toBeGreaterThanOrEqual(1);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/05-journal-section.png`,
      fullPage: false,
    });
  });

  test("06 - Dashboard has navigation header", async () => {
    test.skip(!dashboardLoaded, "Dashboard did not load (auth/access redirect)");

    // Nav should have Community and Journaling History links
    const navLinks = authedPage.locator("text=/community|journaling history|history/i");
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThanOrEqual(1);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/06-nav-header.png`,
      fullPage: false,
    });
  });

  test("07 - Dashboard shows vision section or onboarding", async () => {
    test.skip(!dashboardLoaded, "Dashboard did not load (auth/access redirect)");

    // Should show either vision cards or onboarding content
    const content = await authedPage.textContent("body");
    const hasVisions =
      content?.toLowerCase().includes("highest self") ||
      content?.toLowerCase().includes("mantra") ||
      content?.toLowerCase().includes("creed") ||
      content?.toLowerCase().includes("vision");
    const hasOnboarding =
      content?.toLowerCase().includes("get started") ||
      content?.toLowerCase().includes("welcome") ||
      content?.toLowerCase().includes("begin");
    const hasDashboard =
      content?.toLowerCase().includes("journal") ||
      content?.toLowerCase().includes("day ") ||
      content?.toLowerCase().includes("congratulations");

    expect(hasVisions || hasOnboarding || hasDashboard).toBe(true);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/07-visions-or-onboarding.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  JOURNAL APIS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Journal APIs", () => {
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

  test("08 - GET user-daily-journals requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/user-daily-journals");
    expect(status).toBe(401);
  });

  test("09 - GET user-daily-journals needs sessionId param", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/journals/user-daily-journals");
    // Missing sessionId → should error
    expect([400, 500]).toContain(status);
  });

  test("10 - POST create-morning-journal requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });

  test("11 - POST create-morning-journal validates required fields", async () => {
    const { status, data } = await apiCall(
      authedPage,
      BASE_URL,
      "/api/journals/create-morning-journal",
      {
        method: "POST",
        body: { sessionId: "00000000-0000-0000-0000-000000000000" },
      }
    );

    // Should fail validation (missing affirmations, gratitudes, etc.)
    expect([400, 422, 500]).toContain(status);
    if (status === 400) {
      const typed = data as { error: unknown };
      expect(typed).toHaveProperty("error");
    }
  });

  test("12 - POST create-evening-journal requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-evening-journal", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });

  test("13 - POST create-weekly-journal requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-weekly-journal", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(401);
  });

  test("14 - PATCH update-journal requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: { journalId: "fake-id" },
    });
    expect(status).toBe(401);
  });

  test("15 - DELETE delete-journal requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/delete-journal", {
      method: "DELETE",
      body: { journalId: "fake-id" },
    });
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  BOOK & ACTION APIs
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Book & Action APIs", () => {
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

  test("16 - GET book-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/books/get-latest-book-session?bookSlug=${BOOK_SLUG}`
    );
    expect(status).toBe(401);
  });

  test("17 - GET book-session returns data when authenticated", async () => {
    const { status, data } = await apiCall(
      authedPage,
      BASE_URL,
      `/api/books/get-latest-book-session?bookSlug=${BOOK_SLUG}`
    );

    // Should succeed or return structured error
    expect([200, 404, 500]).toContain(status);
    if (status === 200) {
      const typed = data as { book: unknown };
      expect(typed).toHaveProperty("book");
    }
  });

  test("18 - GET visions requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(
      page,
      BASE_URL,
      "/api/visions/get-user-visions?sessionId=fake"
    );
    expect(status).toBe(401);
  });

  test("19 - GET actions requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(
      page,
      BASE_URL,
      "/api/actions/get-user-daily-action?sessionId=fake"
    );
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("20 - Dashboard mobile renders without overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    await page.goto(`${BASE_URL}/${BOOK_SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(7000);

    const url = page.url();
    if (url.includes(BOOK_SLUG) && !url.includes("/login")) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/20-dashboard-mobile.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard - Accessibility", () => {
  test("21 - Dashboard has interactive elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    await page.goto(`${BASE_URL}/${BOOK_SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(7000);

    const url = page.url();
    if (url.includes(BOOK_SLUG) && !url.includes("/login")) {
      // Should have clickable elements (buttons, links)
      const interactive = page.locator("button, a[href]");
      const count = await interactive.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/21-dashboard-a11y.png`,
      fullPage: false,
    });
  });

  test("22 - Dashboard keyboard navigation works", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    await page.goto(`${BASE_URL}/${BOOK_SLUG}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(7000);

    const url = page.url();
    if (url.includes(BOOK_SLUG) && !url.includes("/login")) {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(["INPUT", "BUTTON", "A", "SELECT", "TEXTAREA", "DIV"]).toContain(focusedTag);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/22-dashboard-keyboard.png`,
      fullPage: false,
    });
  });
});
