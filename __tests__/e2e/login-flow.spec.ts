import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");

    // Check page loads
    await expect(page).toHaveTitle(/Gynergy/);

    // Check for login form elements using text content
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByText("Email Address")).toBeVisible();
    await expect(page.getByText("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("can switch to signup mode", async ({ page }) => {
    await page.goto("/login");

    // Click signup link
    await page.getByRole("button", { name: /Don't have an account/i }).click();

    // Check signup form
    await expect(page.getByRole("heading", { name: /Create Your Account/i })).toBeVisible();
    await expect(page.getByText("Confirm Password")).toBeVisible();
  });

  test("can access forgot password", async ({ page }) => {
    await page.goto("/login");

    // Click forgot password
    await page.getByRole("button", { name: /Forgot password/i }).click();

    // Check forgot password form
    await expect(page.getByRole("heading", { name: /Reset Your Password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Reset Link/i })).toBeVisible();
  });

  test("home page redirects to login for protected routes", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/date-zero-gratitude");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("webinar page is accessible without login", async ({ page }) => {
    await page.goto("/webinar");

    // Should load webinar page - check for any webinar-related content
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toContain("/webinar");
  });

  test("assessment page is accessible without login", async ({ page }) => {
    await page.goto("/assessment");

    // Should load assessment page
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/assessment");
  });

  test("admin page requires login", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login (since not authenticated)
    await expect(page).toHaveURL(/\/login/);
  });
});
