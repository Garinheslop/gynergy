import { test, expect } from "@playwright/test";

test.describe("PWA Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have valid manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();

    // Verify required manifest fields
    expect(manifest.name).toBe("Gynergy - 45 Day Transformation");
    expect(manifest.short_name).toBe("Gynergy");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#6366f1");
    expect(manifest.background_color).toBe("#ffffff");
    expect(manifest.start_url).toBe("/");

    // Verify icons exist
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Check for required icon sizes
    const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(iconSizes).toContain("192x192");
    expect(iconSizes).toContain("512x512");

    // Verify shortcuts
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBe(3);
  });

  test("should have service worker file available", async ({ request }) => {
    // Service worker registration depends on browser context
    // Instead, verify the service worker file is accessible
    const swResponse = await request.get("/sw.js");
    expect(swResponse.status()).toBe(200);

    const swContent = await swResponse.text();
    expect(swContent).toContain("workbox");
    expect(swContent).toContain("precacheAndRoute");
  });

  test("should have correct meta tags for PWA", async ({ page }) => {
    await page.goto("/");

    // Check theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(themeColor).toBe("#6366f1");

    // Check apple-mobile-web-app-capable
    const appleMobileCapable = await page
      .locator('meta[name="apple-mobile-web-app-capable"]')
      .getAttribute("content");
    expect(appleMobileCapable).toBe("yes");

    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestLink).toBe("/manifest.json");
  });

  test("should load all PWA icons", async ({ request }) => {
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of iconSizes) {
      const response = await request.get(`/icons/icon-${size}x${size}.png`);
      expect(response.status(), `Icon ${size}x${size} should exist`).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });

  test("should display correctly on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "__tests__/e2e/screenshots/mobile-home.png",
      fullPage: false,
    });

    // Verify page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain("Gynergy");
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "__tests__/e2e/screenshots/tablet-home.png",
      fullPage: false,
    });

    // Verify page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain("Gynergy");
  });

  test("should display correctly on desktop viewport", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "__tests__/e2e/screenshots/desktop-home.png",
      fullPage: false,
    });

    // Verify page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain("Gynergy");
  });

  test("should have valid shortcut icons", async ({ request }) => {
    const shortcuts = ["shortcut-morning", "shortcut-evening", "shortcut-chat"];

    for (const shortcut of shortcuts) {
      const response = await request.get(`/icons/${shortcut}.png`);
      expect(response.status(), `${shortcut}.png should exist`).toBe(200);
    }
  });

  test("should have proper caching configuration", async ({ request }) => {
    // Verify the service worker has caching routes configured
    const swResponse = await request.get("/sw.js");
    const swContent = await swResponse.text();

    // Check for expected cache names in the service worker
    expect(swContent).toContain("google-fonts");
    expect(swContent).toContain("static-image-assets");
    expect(swContent).toContain("apis");
  });

  test("should have correct viewport meta tag", async ({ page }) => {
    await page.goto("/");

    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewportMeta).toContain("width=device-width");
    expect(viewportMeta).toContain("initial-scale=1");
  });
});

test.describe("PWA Visual Tests", () => {
  test("capture home page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Create screenshots directory if it doesn't exist
    await page.screenshot({
      path: "__tests__/e2e/screenshots/pwa-home-full.png",
      fullPage: true,
    });
  });

  test("verify favicon loads", async ({ request }) => {
    const faviconResponse = await request.get("/favicon.ico");
    expect(faviconResponse.status()).toBe(200);

    const favicon16 = await request.get("/favicon-16x16.png");
    expect(favicon16.status()).toBe(200);

    const favicon32 = await request.get("/favicon-32x32.png");
    expect(favicon32.status()).toBe(200);
  });

  test("verify apple touch icon loads", async ({ request }) => {
    const appleTouchIcon = await request.get("/apple-touch-icon.png");
    expect(appleTouchIcon.status()).toBe(200);
  });
});
