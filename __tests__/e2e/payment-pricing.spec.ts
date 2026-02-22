/**
 * Payment & Pricing System — E2E Tests
 *
 * Covers:
 * - Public pages: checkout recovery, payment upsell, payment success
 * - API auth: unauthenticated returns 401
 * - POST /api/payments/create-checkout (product type validation)
 * - GET /api/payments/entitlements (auth, response shape)
 * - GET /api/payments/subscription (auth, no-subscription case)
 * - Friend code validation (PUT is public), GET/POST/DELETE require auth
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const SCREENSHOT_DIR = "test-results/payment-pricing";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Wait for meaningful page content to render.
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
//  PUBLIC PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment - Public Pages", () => {
  test("01 - Checkout recovery page loads with downsell offer", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/recovery`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Hero heading
    const heading = page.getByRole("heading", {
      name: /I respect that you.*re thinking it through/i,
    });
    await expect(heading).toBeVisible();

    // Downsell pricing
    const price = page.locator("text=$39.95");
    await expect(price.first()).toBeVisible();

    // Primary CTA
    const journalCta = page.locator("button", { hasText: /Start the Daily Practice/i });
    await expect(journalCta.first()).toBeVisible();

    // Secondary CTA (full challenge link)
    const challengeLink = page.locator("a", { hasText: /full challenge/i });
    await expect(challengeLink.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-checkout-recovery.png`,
      fullPage: false,
    });
  });

  test("02 - Checkout recovery has testimonial and support email", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/recovery`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Testimonial
    const testimonial = page.locator("text=Michael T.");
    await expect(testimonial.first()).toBeVisible();

    // Support email
    const supportLink = page.locator("a[href='mailto:support@gynergy.app']");
    await expect(supportLink).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-recovery-testimonial.png`,
      fullPage: false,
    });
  });

  test("03 - Payment upsell page loads with annual offer", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/upsell`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Main heading
    const heading = page.getByRole("heading", {
      name: /Lock In the Daily Practice for a Full Year/i,
    });
    await expect(heading).toBeVisible();

    // Annual pricing
    const price = page.locator("text=$399");
    await expect(price.first()).toBeVisible();

    // Save badge
    const saveBadge = page.locator("text=Save $80");
    await expect(saveBadge.first()).toBeVisible();

    // Primary CTA
    const annualCta = page.locator("button", { hasText: /Add Annual Journal/i });
    await expect(annualCta.first()).toBeVisible();

    // Skip CTA
    const skipCta = page.locator("button", { hasText: /No thanks/i });
    await expect(skipCta.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-payment-upsell.png`,
      fullPage: false,
    });
  });

  test("04 - Payment upsell skip button navigates to success", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/upsell`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const skipButton = page.locator("button", { hasText: /No thanks/i });
    await expect(skipButton.first()).toBeVisible();
    await skipButton.first().click();
    await page.waitForTimeout(3000);

    // Should navigate to payment success
    expect(page.url()).toContain("/payment/success");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-upsell-skip-navigation.png`,
      fullPage: false,
    });
  });

  test("05 - Payment success page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/success`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    // The success page uses Redux state and polling, so content varies
    // Just verify it loads without crashing
    await page.waitForTimeout(3000);
    const pageText = await page.locator("body").innerText();
    // Should have some content (may show loading, processing, or error state)
    expect(pageText.trim().length).toBeGreaterThan(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-payment-success.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  API — Unauthenticated (401)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment API - Unauthenticated", () => {
  test("06 - GET entitlements without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/entitlements");
    expect(status).toBe(401);
  });

  test("07 - GET subscription without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/subscription");
    expect(status).toBe(401);
  });

  test("08 - GET friend-code without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/friend-code");
    expect(status).toBe(401);
  });

  test("09 - POST friend-code redeem without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "POST",
      body: { code: "FAKECODE" },
    });
    expect(status).toBe(401);
  });

  test("10 - DELETE friend-code without auth returns 401", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(
      page,
      BASE_URL,
      `/api/payments/friend-code?codeId=${FAKE_UUID}`,
      { method: "DELETE" }
    );
    expect(status).toBe(401);
  });

  test("11 - POST create-checkout with journal_monthly without auth returns 401", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/create-checkout", {
      method: "POST",
      body: { productType: "journal_monthly" },
    });
    expect(status).toBe(401);
  });

  test("12 - POST create-checkout with journal_annual without auth returns 401", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status } = await apiCall(page, BASE_URL, "/api/payments/create-checkout", {
      method: "POST",
      body: { productType: "journal_annual" },
    });
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  FRIEND CODE — Public Validation (PUT)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Friend Code - Public Validation", () => {
  test("13 - PUT friend-code validate requires code param", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "PUT",
      body: {},
    });
    expect(status).toBe(400);
    const typed = data as { error: string };
    expect(typed.error).toContain("required");
  });

  test("14 - PUT friend-code validate with fake code returns invalid", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "PUT",
      body: { code: "TOTALLY-FAKE-CODE-12345" },
    });
    expect(status).toBe(200);
    const typed = data as { valid: boolean; reason: string };
    expect(typed.valid).toBe(false);
    expect(typed.reason).toBe("Code not found");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  API — Authenticated Flows
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment API - Authenticated", () => {
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

  // ─── Entitlements ──────────────────────

  test("15 - GET entitlements returns expected shape", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/entitlements");
    expect(status).toBe(200);
    const typed = data as {
      entitlements: Record<string, unknown> | null;
      friendCodes: unknown[];
      subscription: unknown | null;
    };
    expect(typed).toHaveProperty("entitlements");
    expect(typed).toHaveProperty("friendCodes");
    expect(typed).toHaveProperty("subscription");
    expect(Array.isArray(typed.friendCodes)).toBe(true);
  });

  // ─── Subscription ──────────────────────

  test("16 - GET subscription returns subscription or null", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/subscription");
    expect(status).toBe(200);
    const typed = data as { subscription: unknown | null; invoices: unknown[] };
    expect(typed).toHaveProperty("subscription");
    expect(typed).toHaveProperty("invoices");
    expect(Array.isArray(typed.invoices)).toBe(true);
  });

  // ─── Create Checkout Validation ──────────────────────

  test("17 - POST create-checkout rejects invalid product type", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/create-checkout", {
      method: "POST",
      body: { productType: "invalid_product" },
    });
    expect(status).toBe(400);
    const typed = data as { error: string };
    expect(typed.error).toContain("Invalid product type");
  });

  test("18 - POST create-checkout rejects empty body", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/payments/create-checkout", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(400);
  });

  // ─── Friend Code Management ──────────────────────

  test("19 - GET friend-code returns codes array", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/friend-code");
    expect(status).toBe(200);
    const typed = data as { friendCodes: unknown[] };
    expect(typed).toHaveProperty("friendCodes");
    expect(Array.isArray(typed.friendCodes)).toBe(true);
  });

  test("20 - POST friend-code redeem requires code param", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "POST",
      body: {},
    });
    expect(status).toBe(400);
    const typed = data as { error: string };
    expect(typed.error).toContain("required");
  });

  test("21 - POST friend-code redeem with fake code fails", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "POST",
      body: { code: "TOTALLY-FAKE-CODE-99999" },
    });
    // Should fail — code doesn't exist in DB (400 or 500)
    expect([400, 500]).toContain(status);
  });

  test("22 - DELETE friend-code requires codeId or code param", async ({ page }) => {
    const { status, data } = await apiCall(page, BASE_URL, "/api/payments/friend-code", {
      method: "DELETE",
    });
    expect(status).toBe(400);
    const typed = data as { error: string };
    expect(typed.error).toContain("required");
  });

  test("23 - DELETE friend-code with fake codeId returns 404", async ({ page }) => {
    const { status, data } = await apiCall(
      page,
      BASE_URL,
      `/api/payments/friend-code?codeId=${FAKE_UUID}`,
      { method: "DELETE" }
    );
    expect(status).toBe(404);
    const typed = data as { error: string };
    expect(typed.error).toContain("not found");
  });

  test("24 - DELETE friend-code with fake code string returns 404", async ({ page }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/payments/friend-code?code=NONEXISTENT", {
      method: "DELETE",
    });
    expect(status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Mobile Responsiveness
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("25 - Checkout recovery page renders on mobile without overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/recovery`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Heading visible
    const heading = page.getByRole("heading", {
      name: /I respect that you.*re thinking it through/i,
    });
    await expect(heading).toBeVisible();

    // Pricing visible
    const price = page.locator("text=$39.95");
    await expect(price.first()).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/25-mobile-checkout-recovery.png`,
      fullPage: false,
    });
  });

  test("26 - Upsell page renders on mobile without overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/upsell`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Heading visible
    const heading = page.getByRole("heading", {
      name: /Lock In the Daily Practice/i,
    });
    await expect(heading).toBeVisible();

    // Price visible
    const price = page.locator("text=$399");
    await expect(price.first()).toBeVisible();

    // No horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/26-mobile-upsell.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Accessibility
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment - Accessibility", () => {
  test("27 - Recovery page has semantic heading structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/recovery`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // h1 — main heading
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();

    // h2 — section headings
    const h2 = page.locator("h2");
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThanOrEqual(1);

    // Buttons are proper <button> elements
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/27-accessibility-recovery.png`,
      fullPage: false,
    });
  });

  test("28 - Upsell page has semantic heading structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/upsell`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // h1 heading
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();

    // h2 for offer section
    const h2 = page.locator("h2");
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThanOrEqual(1);

    // Both CTAs are <button> elements
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/28-accessibility-upsell.png`,
      fullPage: false,
    });
  });

  test("29 - Recovery page has accessible support email link", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/recovery`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const supportLink = page.locator("a[href='mailto:support@gynergy.app']");
    await expect(supportLink).toBeVisible();
    const href = await supportLink.getAttribute("href");
    expect(href).toBe("mailto:support@gynergy.app");
  });

  test("30 - Upsell page has accessible support email link", async ({ page }) => {
    await page.goto(`${BASE_URL}/payment/upsell`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const supportLink = page.locator("a[href='mailto:support@gynergy.app']");
    await expect(supportLink).toBeVisible();
    const href = await supportLink.getAttribute("href");
    expect(href).toBe("mailto:support@gynergy.app");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Cross-Endpoint Validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Payment API - Cross-Endpoint Validation", () => {
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

  test("31 - Entitlements and subscription data are consistent", async ({ page }) => {
    const [entRes, subRes] = await Promise.all([
      apiCall(page, BASE_URL, "/api/payments/entitlements"),
      apiCall(page, BASE_URL, "/api/payments/subscription"),
    ]);

    expect(entRes.status).toBe(200);
    expect(subRes.status).toBe(200);

    const ent = entRes.data as {
      entitlements: { journalSubscriptionId?: string | null } | null;
      subscription: { id?: string } | null;
    };
    const sub = subRes.data as { subscription: { id?: string } | null };

    // If entitlements shows a subscription ID, subscription endpoint should have matching data
    if (ent.entitlements?.journalSubscriptionId) {
      expect(sub.subscription).not.toBeNull();
    }
  });

  test("32 - Friend codes from entitlements match friend-code endpoint", async ({ page }) => {
    const [entRes, fcRes] = await Promise.all([
      apiCall(page, BASE_URL, "/api/payments/entitlements"),
      apiCall(page, BASE_URL, "/api/payments/friend-code"),
    ]);

    expect(entRes.status).toBe(200);
    expect(fcRes.status).toBe(200);

    const ent = entRes.data as { friendCodes: { code: string }[] };
    const fc = fcRes.data as { friendCodes: { code: string }[] };

    // Both endpoints should return the same codes (entitlements is a subset view)
    const entCodes = ent.friendCodes.map((c) => c.code).sort();
    const fcCodes = fc.friendCodes.map((c) => c.code).sort();
    expect(entCodes).toEqual(fcCodes);
  });

  test("33 - Subscription cancel without subscription returns appropriate response", async ({
    page,
  }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/payments/subscription", {
      method: "DELETE",
      body: { immediate: false },
    });
    // If user has no subscription, should return error (404 or 500) not crash
    expect([200, 404, 500]).toContain(status);
  });

  test("34 - Subscription resume without cancel flag returns appropriate response", async ({
    page,
  }) => {
    const { status } = await apiCall(page, BASE_URL, "/api/payments/subscription", {
      method: "PUT",
      body: {},
    });
    // If user has no subscription or no cancel flag, should not crash
    expect([200, 400, 404, 500]).toContain(status);
  });
});
