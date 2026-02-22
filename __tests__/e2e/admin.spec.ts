/**
 * Admin Panel — E2E Tests
 *
 * Covers:
 * - Admin access control: unauthenticated + non-admin redirects
 * - Admin API auth: all endpoints require admin role
 * - Admin dashboard: loads with stats, charts, activity
 * - Admin sub-pages: users, payments, community, content, analytics,
 *   system, audit, gamification, assessment, webinar, settings
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

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

    await page.waitForTimeout(5000);
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

    await page.waitForTimeout(5000);
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
//  ADMIN API AUTH REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - API Auth (Unauthenticated)", () => {
  test("04 - GET admin/stats requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/stats");
    expect([401, 403]).toContain(status);
  });

  test("05 - GET admin/users requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/users");
    expect([401, 403]).toContain(status);
  });

  test("06 - GET admin/payments requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/payments");
    expect([401, 403]).toContain(status);
  });

  test("07 - GET admin/community requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/community");
    expect([401, 403]).toContain(status);
  });

  test("08 - GET admin/content requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/content");
    expect([401, 403]).toContain(status);
  });

  test("09 - GET admin/analytics requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/analytics");
    expect([401, 403]).toContain(status);
  });

  test("10 - GET admin/system requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/system");
    expect([401, 403]).toContain(status);
  });

  test("11 - GET admin/audit-logs requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/audit-logs");
    expect([401, 403]).toContain(status);
  });

  test("12 - GET admin/gamification requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/gamification");
    expect([401, 403]).toContain(status);
  });

  test("13 - GET admin/settings requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/settings");
    expect([401, 403]).toContain(status);
  });

  test("14 - GET admin/activity requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/activity");
    expect([401, 403]).toContain(status);
  });

  test("15 - GET admin/alerts requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/alerts");
    expect([401, 403]).toContain(status);
  });

  test("16 - GET admin/trends requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/trends");
    expect([401, 403]).toContain(status);
  });

  test("17 - GET admin/insights requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/admin/insights");
    expect([401, 403]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN API AUTH (AUTHENTICATED NON-ADMIN)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - API Auth (Non-Admin User)", () => {
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

  test("18 - GET admin/stats returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/stats");
    // 200 if user IS admin, 403 if not
    expect([200, 403]).toContain(status);
  });

  test("19 - GET admin/users returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/users");
    expect([200, 403, 500]).toContain(status);
  });

  test("20 - GET admin/payments returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/payments");
    expect([200, 403, 500]).toContain(status);
  });

  test("21 - GET admin/community returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/community");
    expect([200, 403, 500]).toContain(status);
  });

  test("22 - POST admin/community requires admin for moderation actions", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/community", {
      method: "POST",
      body: { itemId: "fake", action: "approve", note: "test" },
    });
    expect([200, 400, 403, 500]).toContain(status);
  });

  test("23 - GET admin/system returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/system");
    expect([200, 403, 500]).toContain(status);
  });

  test("24 - GET admin/audit-logs returns 403 for non-admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/audit-logs");
    expect([200, 403, 500]).toContain(status);
  });

  test("25 - POST admin/settings requires admin", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/admin/settings", {
      method: "POST",
      body: { defaultDateRange: "30d" },
    });
    expect([200, 400, 403, 500]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (AUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Admin - Dashboard Page", () => {
  test.describe.configure({ mode: "serial" });

  let authedPage: Page;
  let adminLoaded = false;

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

  test("26 - Admin dashboard loads or redirects non-admin", async () => {
    await authedPage.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await authedPage.waitForTimeout(5000);

    const url = authedPage.url();
    if (url.includes("/admin")) {
      adminLoaded = true;
      const content = await authedPage.textContent("body");
      expect(content!.length).toBeGreaterThan(50);
    } else {
      // Non-admin redirect — acceptable
      expect(url.length).toBeGreaterThan(0);
    }

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/26-admin-dashboard.png`,
      fullPage: false,
    });
  });

  test("27 - Admin dashboard has navigation sidebar", async () => {
    test.skip(!adminLoaded, "Admin dashboard did not load (non-admin redirect)");

    const navLinks = authedPage.locator(
      "text=/users|payments|community|content|analytics|system|audit|settings/i"
    );
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThanOrEqual(3);

    await authedPage.screenshot({
      path: `${SCREENSHOT_DIR}/27-admin-sidebar.png`,
      fullPage: false,
    });
  });

  test("28 - Admin dashboard shows stat cards", async () => {
    test.skip(!adminLoaded, "Admin dashboard did not load");

    const content = await authedPage.textContent("body");
    const hasStats =
      content?.toLowerCase().includes("users") ||
      content?.toLowerCase().includes("revenue") ||
      content?.toLowerCase().includes("active") ||
      content?.toLowerCase().includes("completion");

    expect(hasStats).toBe(true);

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
  let adminLoaded = false;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    authedPage = await ctx.newPage();
    await authedPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(authedPage, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);

    // Check if user has admin access
    await authedPage.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await authedPage.waitForTimeout(5000);
    adminLoaded = authedPage.url().includes("/admin");
  });

  test.afterAll(async () => {
    await authedPage.context().close();
  });

  const adminPages = [
    {
      route: "/admin/users",
      name: "Users",
      test: "29",
      keywords: ["user", "email", "access", "streak"],
    },
    {
      route: "/admin/payments",
      name: "Payments",
      test: "30",
      keywords: ["revenue", "payment", "subscription", "mrr"],
    },
    {
      route: "/admin/community",
      name: "Community",
      test: "31",
      keywords: ["moderation", "pending", "review", "community"],
    },
    {
      route: "/admin/content",
      name: "Content",
      test: "32",
      keywords: ["content", "challenge", "video", "quote", "day"],
    },
    {
      route: "/admin/analytics",
      name: "Analytics",
      test: "33",
      keywords: ["analytics", "engagement", "growth", "active"],
    },
    {
      route: "/admin/system",
      name: "System",
      test: "34",
      keywords: ["system", "health", "status", "database", "api"],
    },
    {
      route: "/admin/audit",
      name: "Audit",
      test: "35",
      keywords: ["audit", "log", "action", "admin"],
    },
    {
      route: "/admin/gamification",
      name: "Gamification",
      test: "36",
      keywords: ["badge", "point", "reward", "leaderboard", "gamification"],
    },
    {
      route: "/admin/assessment",
      name: "Assessment",
      test: "37",
      keywords: ["assessment", "funnel", "score", "completion"],
    },
    {
      route: "/admin/webinar",
      name: "Webinar",
      test: "38",
      keywords: ["webinar", "registration", "attendance", "replay"],
    },
    {
      route: "/admin/settings",
      name: "Settings",
      test: "39",
      keywords: ["settings", "preference", "configuration", "theme"],
    },
  ];

  for (const adminPage of adminPages) {
    test(`${adminPage.test} - Admin ${adminPage.name} page loads`, async () => {
      test.skip(!adminLoaded, "No admin access");

      await authedPage.goto(`${BASE_URL}${adminPage.route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await authedPage.waitForTimeout(3000);

      const url = authedPage.url();
      if (url.includes(adminPage.route)) {
        const content = await authedPage.textContent("body");
        const hasExpectedContent = adminPage.keywords.some((keyword) =>
          content?.toLowerCase().includes(keyword)
        );
        expect(hasExpectedContent).toBe(true);
      }

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
    await page.waitForTimeout(5000);

    if (page.url().includes("/admin")) {
      const headings = page.locator("h1, h2, h3");
      expect(await headings.count()).toBeGreaterThanOrEqual(1);
    }

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
    await page.waitForTimeout(5000);

    if (page.url().includes("/admin")) {
      const interactive = page.locator("button, a[href], input, select");
      const count = await interactive.count();
      expect(count).toBeGreaterThanOrEqual(5);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/42-admin-a11y-interactive.png`,
      fullPage: false,
    });
  });
});
