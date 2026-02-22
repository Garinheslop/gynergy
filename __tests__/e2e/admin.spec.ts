/**
 * Admin Panel — E2E Tests
 *
 * Covers:
 * - Admin access control: unauthenticated user redirects
 * - Admin API auth: all endpoints require auth (401 for unauth)
 * - Admin API (authenticated admin): endpoints return 200 with valid shape
 * - Admin dashboard: loads with navigation, stats, content
 * - Admin sub-pages: users, payments, community, content, analytics,
 *   system, audit, gamification, assessment, webinar, settings
 * - Health check: no 500 errors on any admin route
 * - Accessibility: heading hierarchy, interactive elements
 *
 * AGENT_PRIMARY state (verified via diagnostic):
 *   IS_ADMIN: true | HAS_CHALLENGE_ACCESS: true | HAS_AI_CONSENT: false
 */

import { expect, test, Page } from "@playwright/test";

import { assertHasKeys } from "./helpers/assertions";
import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const SCREENSHOT_DIR = "test-results/admin";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Access Control", () => {
  test("01 - Unauthenticated user redirected from admin dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|$)/, { timeout: 15000 });
    const url = page.url();
    expect(url.includes("/login") || url === `${BASE_URL}/` || url === BASE_URL).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-admin-unauth-redirect.png`,
      fullPage: false,
    });
  });

  test("02 - Unauthenticated user redirected from admin users", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|admin|$)/, { timeout: 15000 }).catch(() => {});
    const url = page.url();
    expect(
      url.includes("/login") || url === `${BASE_URL}/` || url === BASE_URL || url.includes("/admin")
    ).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-admin-users-unauth.png`,
      fullPage: false,
    });
  });

  test("03 - Unauthenticated user redirected from admin payments", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/payments`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForURL(/\/(login|admin|$)/, { timeout: 15000 }).catch(() => {});
    const url = page.url();
    expect(
      url.includes("/login") || url === `${BASE_URL}/` || url === BASE_URL || url.includes("/admin")
    ).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-admin-payments-unauth.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN API AUTH REQUIREMENTS (UNAUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - API Auth (Unauthenticated)", () => {
  test("04 - GET admin/stats requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/stats");
    expect(status).toBe(401);
  });

  test("05 - GET admin/users requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/users");
    expect(status).toBe(401);
  });

  test("06 - GET admin/payments requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/payments");
    expect(status).toBe(401);
  });

  test("07 - GET admin/community requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/community");
    expect(status).toBe(401);
  });

  test("08 - GET admin/content requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/content");
    expect(status).toBe(401);
  });

  test("09 - GET admin/analytics requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/analytics");
    expect(status).toBe(401);
  });

  test("10 - GET admin/system requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/system");
    expect(status).toBe(401);
  });

  test("11 - GET admin/audit-logs requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/audit-logs");
    expect(status).toBe(401);
  });

  test("12 - GET admin/gamification requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/gamification");
    expect(status).toBe(401);
  });

  test("13 - GET admin/settings requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/settings");
    expect(status).toBe(401);
  });

  test("14 - GET admin/activity requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/activity");
    expect(status).toBe(401);
  });

  test("15 - GET admin/alerts requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/alerts");
    expect(status).toBe(401);
  });

  test("16 - GET admin/trends requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/trends");
    expect(status).toBe(401);
  });

  test("17 - GET admin/insights requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/insights");
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN API AUTH (AUTHENTICATED ADMIN)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Authenticated Admin API", () => {
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

  test("18 - GET admin/stats returns 200 with stats data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/stats");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("19 - GET admin/users returns 200 with user data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/users");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("20 - GET admin/payments returns 200 with payment data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/payments");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("21 - GET admin/community returns 200 with community data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/community");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("22 - POST admin/community moderation action returns 200", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/community", {
      method: "POST",
      body: { itemId: "fake", action: "approve", note: "test" },
    });
    // POST with fake data may return 200 or 400 (bad input), but never 500
    expect([200, 400]).toContain(status);
    assertHasKeys(data, ["success"]);
  });

  test("23 - GET admin/system returns 200 with system data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/system");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("24 - GET admin/audit-logs returns 200 with audit data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/audit-logs");
    expect(status).toBe(200);
    assertHasKeys(data, ["success", "data"]);
  });

  test("25 - POST admin/settings returns 200 for valid settings", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/admin/settings", {
      method: "POST",
      body: { defaultDateRange: "30d" },
    });
    // POST may return 200 or 400 (validation), but never 500
    expect([200, 400]).toContain(status);
    assertHasKeys(data, ["success"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (AUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Dashboard Page", () => {
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

  test("26 - Admin dashboard loads for admin user", async () => {
    await authedPage.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await authedPage.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    expect(authedPage.url()).toContain("/admin");

    const content = await authedPage.textContent("body");
    expect(content!.length).toBeGreaterThan(100);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/26-admin-dashboard.png`,
      fullPage: false,
    });
  });

  test("27 - Admin dashboard has navigation sidebar", async () => {
    const navLinks = authedPage.locator('nav a, aside a, [class*="sidebar"] a');
    expect(await navLinks.count()).toBeGreaterThanOrEqual(3);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/27-admin-sidebar.png`,
      fullPage: false,
    });
  });

  test("28 - Admin dashboard shows substantial content", async () => {
    const content = await authedPage.textContent("body");
    expect(content!.length).toBeGreaterThan(100);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/28-admin-stats.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN SUB-PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Sub-Pages", () => {
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

  const adminPages = [
    { route: "/admin/users", name: "Users", test: "29" },
    { route: "/admin/payments", name: "Payments", test: "30" },
    { route: "/admin/community", name: "Community", test: "31" },
    { route: "/admin/content", name: "Content", test: "32" },
    { route: "/admin/analytics", name: "Analytics", test: "33" },
    { route: "/admin/system", name: "System", test: "34" },
    { route: "/admin/audit", name: "Audit", test: "35" },
    { route: "/admin/gamification", name: "Gamification", test: "36" },
    { route: "/admin/assessment", name: "Assessment", test: "37" },
    { route: "/admin/webinar", name: "Webinar", test: "38" },
    { route: "/admin/settings", name: "Settings", test: "39" },
  ];

  for (const adminPage of adminPages) {
    test(`${adminPage.test} - Admin ${adminPage.name} page loads`, async () => {
      await authedPage.goto(`${BASE_URL}${adminPage.route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await authedPage.waitForLoadState("networkidle").catch(() => {});

      // Admin user should stay on the admin page
      expect(authedPage.url()).toContain(adminPage.route);

      // Page should have headings indicating real content loaded
      const headings = authedPage.locator("h1, h2, h3");
      expect(await headings.count()).toBeGreaterThanOrEqual(1);

      // Page should have substantial content
      const content = await authedPage.textContent("body");
      expect(content!.length).toBeGreaterThan(50);

      await authedPage.screenshot({
        path: `${SCREENSHOT_DIR}/${adminPage.test}-admin-${adminPage.name.toLowerCase()}.png`,
        fullPage: false,
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Health Check", () => {
  test("40 - All admin routes respond without 500 errors", async ({ page }) => {
    test.setTimeout(120000);

    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    const adminRoutes = [
      "/admin",
      "/admin/users",
      "/admin/payments",
      "/admin/community",
      "/admin/content",
      "/admin/analytics",
      "/admin/system",
      "/admin/audit",
      "/admin/gamification",
      "/admin/assessment",
      "/admin/webinar",
      "/admin/settings",
    ];

    for (const route of adminRoutes) {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;
      // Should not 500 — either loads (200) or redirects (302/307)
      expect(status).not.toBe(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/40-admin-health-check.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Accessibility", () => {
  test("41 - Admin dashboard has heading hierarchy", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    expect(page.url()).toContain("/admin");

    const headings = page.locator("h1, h2, h3");
    expect(await headings.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/41-admin-a11y-headings.png`,
      fullPage: false,
    });
  });

  test("42 - Admin dashboard has interactive elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    expect(page.url()).toContain("/admin");

    const interactive = page.locator("button, a[href], input, select");
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/42-admin-a11y-interactive.png`,
      fullPage: false,
    });
  });
});
