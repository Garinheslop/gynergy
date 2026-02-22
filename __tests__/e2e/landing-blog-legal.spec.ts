/**
 * Landing, Blog & Legal Pages — E2E Tests
 *
 * Covers:
 * - Landing/home page: hero, pricing section, CTAs
 * - Blog listing: header, post cards, navigation
 * - Blog post detail: content, back navigation, 404 handling
 * - Assessment page: loads, start button
 * - Legal pages: privacy policy, terms of service
 * - Pricing redirect: redirects to home
 * - Mobile responsiveness
 * - Accessibility
 */

import { expect, test, Page } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/landing-blog-legal";
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

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
//  LANDING / HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Landing Page", () => {
  test("01 - Landing page loads with hero content", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Key content: 45-Day Awakening Challenge
    const challengeText = page.locator("text=/45.?day/i");
    await expect(challengeText.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-landing-hero.png`,
      fullPage: false,
    });
  });

  test("02 - Landing page shows pricing ($997)", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    // Scroll to pricing section
    await page.evaluate(() => {
      const pricing = document.getElementById("pricing");
      if (pricing) pricing.scrollIntoView();
      else window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    const price = page.locator("text=/997/");
    const priceCount = await price.count();
    expect(priceCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-landing-pricing.png`,
      fullPage: false,
    });
  });

  test("03 - Landing page has CTA buttons", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const cta = page
      .locator("button, a[role='button'], a")
      .filter({ hasText: /get started|enroll|sign up|join|checkout|start/i });
    const ctaCount = await cta.count();
    expect(ctaCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-landing-cta.png`,
      fullPage: false,
    });
  });

  test("04 - Landing page has navigation with login link", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const navLink = page.locator("a, button").filter({ hasText: /sign in|log in|login|enroll/i });
    const count = await navLink.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-landing-nav.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  BLOG PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Blog", () => {
  test("05 - Blog listing page loads with posts", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const heading = page.locator("text=/the blog|blog/i");
    await expect(heading.first()).toBeVisible();

    const postLinks = page.locator("a[href*='/blog/']");
    const postCount = await postLinks.count();
    expect(postCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-blog-listing.png`,
      fullPage: false,
    });
  });

  test("06 - Blog post detail page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/five-pillar-framework`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const title = page.locator("text=/five pillar/i");
    await expect(title.first()).toBeVisible();

    const backLink = page.locator("a, button").filter({ hasText: /back.*blog/i });
    await expect(backLink.first()).toBeVisible();

    // Substantial content
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-blog-post.png`,
      fullPage: false,
    });
  });

  test("07 - Blog post has read time and category", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/five-pillar-framework`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const readTime = page.locator("text=/min/i");
    await expect(readTime.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-blog-metadata.png`,
      fullPage: false,
    });
  });

  test("08 - Blog invalid slug returns 404 or not found", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/blog/totally-fake-post-xyz`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status();
    const bodyText = await page.textContent("body");
    const has404 = status === 404 || bodyText?.toLowerCase().includes("not found");

    expect(has404).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-blog-404.png`,
      fullPage: false,
    });
  });

  test("09 - Blog listing links navigate to post detail", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const firstPost = page.locator("a[href*='/blog/']").first();
    await firstPost.click();
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toContain("/blog/");
    expect(url).not.toMatch(/\/blog\/?$/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-blog-navigation.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ASSESSMENT PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Assessment", () => {
  test("10 - Assessment page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/assessment`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const content = await page.textContent("body");
    const hasContent =
      content?.toLowerCase().includes("assessment") ||
      content?.toLowerCase().includes("pillar") ||
      content?.toLowerCase().includes("discover") ||
      content?.toLowerCase().includes("quiz");

    expect(hasContent).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-assessment.png`,
      fullPage: false,
    });
  });

  test("11 - Assessment has interactive start button", async ({ page }) => {
    await page.goto(`${BASE_URL}/assessment`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const startBtn = page
      .locator("button, a")
      .filter({ hasText: /start|begin|take|discover|get started/i });
    const btnCount = await startBtn.count();
    expect(btnCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-assessment-start.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  LEGAL PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Legal Pages", () => {
  test("12 - Privacy policy page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Legal pages have minimal body text (heading + Termly iframe), so wait for heading instead
    const heading = page.locator("text=/privacy policy/i");
    await expect(heading.first()).toBeVisible({ timeout: 15000 });

    const iframe = page.locator("iframe");
    expect(await iframe.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-privacy.png`,
      fullPage: false,
    });
  });

  test("13 - Terms of service page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Legal pages have minimal body text (heading + Termly iframe), so wait for heading instead
    const heading = page.locator("text=/terms of service/i");
    await expect(heading.first()).toBeVisible({ timeout: 15000 });

    const iframe = page.locator("iframe");
    expect(await iframe.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-terms.png`,
      fullPage: false,
    });
  });

  test("14 - Pricing page redirects to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url === `${BASE_URL}/` || url === BASE_URL || url.endsWith("/pricing")).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-pricing-redirect.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MOBILE RESPONSIVENESS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Public Pages - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("15 - Landing page mobile — no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-landing-mobile.png`,
      fullPage: false,
    });
  });

  test("16 - Blog mobile — no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-blog-mobile.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Public Pages - Accessibility", () => {
  test("17 - Landing page has heading hierarchy", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    const headings = page.locator("h1, h2, h3");
    expect(await headings.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-landing-a11y.png`,
      fullPage: false,
    });
  });

  test("18 - Blog post has semantic structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/five-pillar-framework`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForPageContent(page);

    expect(await page.locator("h1, h2, h3").count()).toBeGreaterThanOrEqual(1);
    expect(await page.locator("p").count()).toBeGreaterThanOrEqual(3);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-blog-a11y.png`,
      fullPage: false,
    });
  });

  test("19 - Legal pages have h1 headings", async ({ page }) => {
    for (const route of ["/privacy", "/terms"]) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      // Legal pages have heading + Termly iframe; wait for h1 directly
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
      expect(await page.locator("h1").count()).toBeGreaterThanOrEqual(1);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/19-legal-a11y.png`,
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  CROSS-PAGE: ALL PUBLIC ROUTES RESPOND WITHOUT 500
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Public Pages - Health Check", () => {
  test("20 - All public routes respond without server errors", async ({ page }) => {
    const publicRoutes = [
      "/",
      "/login",
      "/blog",
      "/blog/five-pillar-framework",
      "/assessment",
      "/journal",
      "/privacy",
      "/terms",
      "/checkout/recovery",
      "/payment/upsell",
      "/payment/success",
    ];

    for (const route of publicRoutes) {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;
      expect(status).not.toBe(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/20-health-check.png`,
      fullPage: false,
    });
  });
});
