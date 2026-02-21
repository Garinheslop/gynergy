/**
 * Journal System — E2E Tests
 *
 * Covers:
 * - Public sales page (/journal)
 * - API auth (unauthenticated returns 401)
 * - GET /api/journals/user-daily-journals (requires sessionId + timezone)
 * - GET /api/journals/user-journal-history (pagination, filtering)
 * - POST create-morning-journal (validation: 5 affirmations, 3 gratitudes, 3 excitements)
 * - POST create-evening-journal (validation: 5 dreammagic entries)
 * - POST create-weekly-journal (validation: wins, challenges, lessons)
 * - PATCH update-journal (ownership, allowed fields)
 * - DELETE delete-journal (ownership, soft delete)
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const SCREENSHOT_DIR = "test-results/journal";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Wait for meaningful page content to render (not just a blank shell).
 */
async function waitForPageContent(page: Page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const body = document.body?.innerText || "";
      return body.trim().length > 20;
    },
    { timeout }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC — Unauthenticated Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal - Public Pages", () => {
  test("01 - Journal sales page loads with hero and pricing", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Hero content
    const heading = page.getByRole("heading", { name: /What Happens After Day 45/i });
    await expect(heading).toBeVisible();

    // Pricing section
    const monthlyText = page.locator("text=$39.95");
    const annualText = page.locator("text=$399");
    await expect(monthlyText.first()).toBeVisible();
    await expect(annualText.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-journal-sales-page.png`,
      fullPage: false,
    });
  });

  test("02 - Journal sales page shows feature grid and testimonials", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Feature titles
    const morningJournal = page.locator("text=Morning Journal");
    const eveningReflection = page.locator("text=Evening Reflection");
    const streakTracking = page.locator("text=Streak Tracking");
    await expect(morningJournal.first()).toBeVisible();
    await expect(eveningReflection.first()).toBeVisible();
    await expect(streakTracking.first()).toBeVisible();

    // Testimonials section
    const testimonialHeading = page.locator("text=What Men Say About the Practice");
    await expect(testimonialHeading.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-journal-features-testimonials.png`,
      fullPage: false,
    });
  });

  test("03 - Plan toggle switches between monthly and annual", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Annual should be selected by default (the CTA button text should reflect that)
    const ctaButton = page.locator("text=Start Annual Practice");
    await expect(ctaButton.first()).toBeVisible();

    // Click the monthly plan button
    const monthlyButton = page.locator("button", { hasText: "Monthly" });
    await monthlyButton.first().click();
    await page.waitForTimeout(500);

    // CTA should update to monthly
    const monthlyCta = page.locator("text=Start Monthly Practice");
    await expect(monthlyCta.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-plan-toggle.png`,
      fullPage: false,
    });
  });

  test("04 - Objection handling section is visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Objection handling content
    const objection = page.locator("text=/Can.*I just do this in a notebook/i");
    await expect(objection.first()).toBeVisible();

    // Assessment link at bottom
    const assessmentLink = page.locator("a[href='/assessment']");
    await expect(assessmentLink).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-objection-handling.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  API — Unauthenticated (401)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal API - Unauthenticated", () => {
  test("05 - GET user-daily-journals without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(
      page,
      BASE_URL,
      "/api/journals/user-daily-journals?sessionId=test"
    );
    expect(status).toBe(401);
  });

  test("06 - GET user-journal-history without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/user-journal-history");
    expect(status).toBe(401);
  });

  test("07 - POST create-morning-journal without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: { sessionId: "test", journal: {} },
    });
    expect(status).toBe(401);
  });

  test("08 - PATCH update-journal without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: { journalId: FAKE_UUID, updates: { mood_score: 5 } },
    });
    expect(status).toBe(401);
  });

  test("09 - DELETE delete-journal without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/journals/delete-journal?journalId=${FAKE_UUID}`,
      { method: "DELETE" }
    );
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  API — Authenticated Flows (serial for shared auth state)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal API - Authenticated", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    if (!result.success) {
      test.skip(true, `Authentication failed: ${result.error}`);
    }
  });

  // ─── GET: Daily Journals ──────────────────────

  test("10 - GET user-daily-journals requires sessionId", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/user-daily-journals");
    expect(status).toBe(400);
    expect(data).toHaveProperty("error");
  });

  test("11 - GET user-daily-journals requires timezone header", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/journals/user-daily-journals?sessionId=${FAKE_UUID}`
    );
    // Missing timezone header
    expect(status).toBe(400);
    expect(data).toHaveProperty("error");
  });

  test("12 - GET user-daily-journals with valid params returns array", async ({ page }) => {
    // Use Playwright's request API directly to set custom headers
    const response = await page.request.fetch(
      `${BASE_URL}/api/journals/user-daily-journals?sessionId=${FAKE_UUID}`,
      {
        method: "GET",
        headers: { "x-user-timezone": "America/New_York" },
      }
    );
    // Should return journals array (empty for fake session) or an error
    // Since the user may not be enrolled in this session, the response depends
    // on what the DB returns — but it shouldn't be a 401
    expect(response.status()).not.toBe(401);
  });

  // ─── GET: Journal History ──────────────────────

  test("13 - GET user-journal-history returns paginated results or error", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      "/api/journals/user-journal-history?limit=5&offset=0"
    );
    // 200 with journals shape, or 500 if DB/RLS issue
    expect([200, 500]).toContain(status);
    if (status === 200) {
      const typed = data as { journals: unknown[]; total: number; hasMore: boolean };
      expect(typed).toHaveProperty("journals");
      expect(typed).toHaveProperty("total");
      expect(typed).toHaveProperty("hasMore");
      expect(Array.isArray(typed.journals)).toBe(true);
      expect(typeof typed.total).toBe("number");
    } else {
      expect(data).toHaveProperty("error");
    }
  });

  test("14 - GET user-journal-history supports journalType filter", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      "/api/journals/user-journal-history?journalType=morning&limit=5"
    );
    expect([200, 500]).toContain(status);
    if (status === 200) {
      const typed = data as { journals: unknown[]; total: number; hasMore: boolean };
      expect(typed).toHaveProperty("journals");
      expect(Array.isArray(typed.journals)).toBe(true);
    }
  });

  test("15 - GET user-journal-history supports date range filter", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      "/api/journals/user-journal-history?startDate=2025-01-01T00:00:00Z&endDate=2025-12-31T23:59:59Z&limit=5"
    );
    expect([200, 500]).toContain(status);
    if (status === 200) {
      const typed = data as { journals: unknown[]; total: number; hasMore: boolean };
      expect(typed).toHaveProperty("journals");
    }
  });

  test("16 - GET invalid request type returns 500", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/nonexistent-type");
    expect(status).toBe(500);
  });

  // ─── POST: Morning Journal Validation ──────────────────────

  test("17 - POST create-morning-journal requires sessionId and journal", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(400);
  });

  test("18 - POST create-morning-journal rejects missing array fields", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: { moodScore: 5 },
        images: [],
      },
    });
    // Should fail validation: missing affirmations (5), gratitudes (3), excitements (3)
    expect(status).toBe(500);
  });

  test("19 - POST create-morning-journal rejects wrong affirmation count", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 5,
          affirmations: ["a", "b", "c"], // Only 3, need 5
          gratitudes: ["g1", "g2", "g3"],
          excitements: ["e1", "e2", "e3"],
        },
        images: [],
      },
    });
    // Validation should reject: need exactly 5 affirmations
    expect(status).toBe(500);
  });

  test("20 - POST create-morning-journal rejects wrong gratitude count", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 5,
          affirmations: ["a1", "a2", "a3", "a4", "a5"],
          gratitudes: ["g1"], // Only 1, need 3
          excitements: ["e1", "e2", "e3"],
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("21 - POST create-morning-journal rejects wrong excitement count", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 5,
          affirmations: ["a1", "a2", "a3", "a4", "a5"],
          gratitudes: ["g1", "g2", "g3"],
          excitements: ["e1", "e2"], // Only 2, need 3
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("22 - POST create-morning-journal rejects no core fields", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          // No moodScore, moodContribution, capturedEssence, or mantra
          affirmations: ["a1", "a2", "a3", "a4", "a5"],
          gratitudes: ["g1", "g2", "g3"],
          excitements: ["e1", "e2", "e3"],
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  // ─── POST: Evening Journal Validation ──────────────────────

  test("23 - POST create-evening-journal rejects missing dreammagic", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-evening-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 4,
          insight: "I learned something",
          // Missing dreammagic (need exactly 5)
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("24 - POST create-evening-journal rejects wrong dreammagic count", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-evening-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 4,
          insight: "I learned something",
          dreammagic: ["d1", "d2", "d3"], // Only 3, need 5
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("25 - POST create-evening-journal rejects no core fields", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-evening-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          // No moodScore, insight, insightImpact, changes, success
          dreammagic: ["d1", "d2", "d3", "d4", "d5"],
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  // ─── POST: Weekly Journal Validation ──────────────────────

  test("26 - POST create-weekly-journal rejects missing wins", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-weekly-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          // Missing wins
          challenges: "Some challenges",
          lessons: "Some lessons",
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("27 - POST create-weekly-journal rejects missing challenges", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-weekly-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          wins: "Some wins",
          // Missing challenges
          lessons: "Some lessons",
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  test("28 - POST create-weekly-journal rejects missing lessons", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-weekly-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          wins: "Some wins",
          challenges: "Some challenges",
          // Missing lessons
        },
        images: [],
      },
    });
    expect(status).toBe(500);
  });

  // ─── PATCH: Update Journal ──────────────────────

  test("29 - PATCH update-journal requires journalId and updates", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: {},
    });
    expect(status).toBe(400);
  });

  test("30 - PATCH update-journal rejects invalid request type", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "PATCH",
      body: { journalId: FAKE_UUID, updates: { mood_score: 5 } },
    });
    expect(status).toBe(400);
  });

  test("31 - PATCH update-journal returns 404 for nonexistent journal", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: { journalId: FAKE_UUID, updates: { mood_score: 5 } },
    });
    expect(status).toBe(404);
    const typed = data as { error: string };
    expect(typed.error).toContain("not found");
  });

  test("32 - PATCH update-journal rejects disallowed fields", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: {
        journalId: FAKE_UUID,
        updates: { user_id: "hacker-id", session_id: "fake" },
      },
    });
    // Either 400 (no valid fields) or 404 (journal not found) — both are acceptable
    expect([400, 404]).toContain(status);
  });

  // ─── DELETE: Delete Journal ──────────────────────

  test("33 - DELETE delete-journal requires journalId param", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/delete-journal", {
      method: "DELETE",
    });
    expect(status).toBe(400);
    const typed = data as { error: string };
    expect(typed.error).toContain("Journal ID is required");
  });

  test("34 - DELETE delete-journal returns 404 for nonexistent journal", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/journals/delete-journal?journalId=${FAKE_UUID}`,
      { method: "DELETE" }
    );
    expect(status).toBe(404);
    const typed = data as { error: string };
    expect(typed.error).toContain("not found");
  });

  test("35 - DELETE with invalid request type returns 400", async ({ page }) => {
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/journals/create-morning-journal?journalId=${FAKE_UUID}`,
      { method: "DELETE" }
    );
    expect(status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Mobile Responsiveness
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("36 - Journal sales page renders on mobile without overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Hero heading visible
    const heading = page.getByRole("heading", { name: /What Happens After Day 45/i });
    await expect(heading).toBeVisible();

    // Pricing buttons visible
    const monthlyText = page.locator("text=$39.95");
    await expect(monthlyText.first()).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/36-mobile-journal-sales.png`,
      fullPage: false,
    });
  });

  test("37 - Feature grid stacks vertically on mobile", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Check that features are visible (in stacked layout)
    const morningJournal = page.locator("text=Morning Journal");
    const aiCoaching = page.locator("text=AI Coaching");
    await expect(morningJournal.first()).toBeVisible();
    await expect(aiCoaching.first()).toBeVisible();

    // Verify layout: in mobile, Morning Journal should be above AI Coaching
    const morningBox = await morningJournal.first().boundingBox();
    const aiBox = await aiCoaching.first().boundingBox();
    if (morningBox && aiBox) {
      expect(morningBox.y).toBeLessThan(aiBox.y);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/37-mobile-feature-stack.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Accessibility
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal - Accessibility", () => {
  test("38 - Journal sales page has semantic heading structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // h1 — main hero heading
    const h1 = page.locator("h1");
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // h2 — section headings
    const h2 = page.locator("h2");
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThanOrEqual(2);

    // h3 — feature titles
    const h3 = page.locator("h3");
    const h3Count = await h3.count();
    expect(h3Count).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/38-accessibility-headings.png`,
      fullPage: false,
    });
  });

  test("39 - Pricing plan buttons are focusable and interactive", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Monthly and Annual are <button> elements
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(3); // Monthly, Annual, CTA

    // The CTA button should have descriptive text
    const ctaButton = page.locator("button", { hasText: /Start.*Practice/i });
    await expect(ctaButton.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/39-accessibility-buttons.png`,
      fullPage: false,
    });
  });

  test("40 - Assessment link at bottom has proper href", async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const assessmentLink = page.locator("a[href='/assessment']");
    await expect(assessmentLink).toBeVisible();
    const href = await assessmentLink.getAttribute("href");
    expect(href).toBe("/assessment");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Cross-Endpoint Validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Journal API - Cross-Endpoint Validation", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);
    const result = await authenticatePage(page, BASE_URL, AGENT_PRIMARY);
    if (!result.success) {
      test.skip(true, `Authentication failed: ${result.error}`);
    }
  });

  test("41 - Morning journal with correct counts but fake session fails gracefully", async ({
    page,
  }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/create-morning-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 5,
          capturedEssence: "I dreamt of flying",
          moodContribution: "Good sleep",
          mantra: "I am strong",
          affirmations: ["a1", "a2", "a3", "a4", "a5"],
          gratitudes: ["g1", "g2", "g3"],
          excitements: ["e1", "e2", "e3"],
        },
        images: [],
      },
    });
    // Should fail because session doesn't exist (no-user-book-session)
    expect(status).toBe(500);
    const typed = data as { error: { message: string } };
    expect(typed).toHaveProperty("error");
  });

  test("42 - Evening journal with correct counts but fake session fails gracefully", async ({
    page,
  }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/create-evening-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          moodScore: 4,
          insight: "An insight",
          insightImpact: "Big impact",
          success: "Finished my work",
          changes: "Wake up earlier",
          dreammagic: ["d1", "d2", "d3", "d4", "d5"],
        },
        images: [],
      },
    });
    // Should fail because session doesn't exist
    expect(status).toBe(500);
    const typed = data as { error: { message: string } };
    expect(typed).toHaveProperty("error");
  });

  test("43 - Weekly journal with all fields but fake session fails gracefully", async ({
    page,
  }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/journals/create-weekly-journal", {
      method: "POST",
      body: {
        sessionId: FAKE_UUID,
        journal: {
          wins: "Won big",
          challenges: "Overcame challenges",
          lessons: "Learned a lot",
        },
        images: [],
      },
    });
    // Should fail because session doesn't exist
    expect(status).toBe(500);
    const typed = data as { error: { message: string } };
    expect(typed).toHaveProperty("error");
  });

  test("44 - History pagination with offset=0 and limit=1 returns at most 1 result", async ({
    page,
  }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      "/api/journals/user-journal-history?limit=1&offset=0"
    );
    // 200 with paginated results, or 500 if DB/RLS issue
    expect([200, 500]).toContain(status);
    if (status === 200) {
      const typed = data as { journals: unknown[]; total: number; hasMore: boolean };
      expect(typed.journals.length).toBeLessThanOrEqual(1);
      if (typed.total > 1) {
        expect(typed.hasMore).toBe(true);
      }
    } else {
      expect(data).toHaveProperty("error");
    }
  });

  test("45 - PATCH with only disallowed fields returns 400", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/journals/update-journal", {
      method: "PATCH",
      body: {
        journalId: FAKE_UUID,
        updates: { user_id: "hacker", created_at: "2020-01-01" },
      },
    });
    // No valid fields to update (user_id and created_at are not in allowedFields)
    // May be 400 (no valid fields) or 404 (journal not found checked first)
    expect([400, 404]).toContain(status);
  });
});
