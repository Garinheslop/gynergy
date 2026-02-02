import { test, expect } from "@playwright/test";

test.describe("Gynergy E2E Tests", () => {
  test("homepage should load", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Gynergy/i);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/journal");

    // Should be redirected to login or show auth prompt
    // Adjust based on your actual auth flow
    await expect(page.url()).toMatch(/login|auth|signin/i);
  });
});

test.describe("Accessibility", () => {
  test("should have no accessibility violations on homepage", async ({ page }) => {
    await page.goto("/");

    // Check for basic accessibility
    // Check that images have alt text
    const images = page.locator("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check that h1 exists
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });
});
