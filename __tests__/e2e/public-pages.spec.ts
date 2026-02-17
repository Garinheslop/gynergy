import { test } from "@playwright/test";

// Comprehensive visual audit - captures screenshots of every page and interaction
test.describe("Full App Visual Audit - Desktop", () => {
  test("01 - Landing page full walkthrough", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/01-landing-hero.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/02-landing-features.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/03-landing-mid.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/04-landing-lower.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/05-landing-more.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/06-landing-footer.png", fullPage: false });
  });

  test("02 - Login page all modes", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/07-login-page.png", fullPage: false });

    // Signup mode
    const signupBtn = page.getByRole("button", { name: /Don't have an account/i });
    if (await signupBtn.isVisible()) {
      await signupBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "test-results/audit/08-signup-mode.png", fullPage: false });
    }

    // Back to login
    const loginBtn = page.getByRole("button", { name: /Already have an account/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForTimeout(500);
    }

    // Forgot password
    const forgotBtn = page.getByRole("button", { name: /Forgot password/i });
    if (await forgotBtn.isVisible()) {
      await forgotBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "test-results/audit/09-forgot-password.png", fullPage: false });
    }
  });

  test("03 - Webinar page full walkthrough", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/10-webinar-hero.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/11-webinar-mid.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/12-webinar-lower.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/13-webinar-more.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/14-webinar-footer.png", fullPage: false });
  });

  test("04 - Assessment page walkthrough", async ({ page }) => {
    await page.goto("/assessment");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/audit/15-assessment-start.png", fullPage: false });

    // Try to start
    const startBtn = page
      .locator("button")
      .filter({ hasText: /start|begin|take|get started|discover/i })
      .first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-results/audit/16-assessment-q1.png", fullPage: false });

      // Try answering - look for rating buttons or options
      const options = page
        .locator("[role='radio'], [role='option'], [data-value], button")
        .filter({
          hasText: /^[1-5]$|strongly|agree|disagree|never|always|rarely|sometimes|often/i,
        });
      if (
        await options
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await options.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: "test-results/audit/17-assessment-answered.png",
          fullPage: false,
        });
      }
    }

    // Scroll to see full assessment
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/18-assessment-scroll.png", fullPage: false });
  });

  test("05 - Pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/19-pricing-top.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/20-pricing-bottom.png", fullPage: false });
  });

  test("06 - Community page", async ({ page }) => {
    await page.goto("/community");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/21-community.png", fullPage: false });
  });

  test("07 - Library page", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/22-library.png", fullPage: false });
  });

  test("08 - Courses page", async ({ page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/23-courses.png", fullPage: false });
  });

  test("09 - Password reset page", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/24-reset-password.png", fullPage: false });
  });

  test("10 - Error handling - invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
      await emailInput.fill("test@invalid-test.com");
      await passwordInput.fill("wrongpassword");
      const signInBtn = page.getByRole("button", { name: /Sign In/i });
      if (await signInBtn.isVisible()) {
        await signInBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "test-results/audit/25-login-error.png", fullPage: false });
      }
    }
  });
});

test.describe("Full App Visual Audit - Mobile (iPhone)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("11 - Mobile landing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/audit/26-mobile-landing-top.png",
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/audit/27-mobile-landing-mid.png",
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/audit/28-mobile-landing-lower.png",
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/audit/29-mobile-landing-footer.png",
      fullPage: false,
    });
  });

  test("12 - Mobile login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/30-mobile-login.png", fullPage: false });
  });

  test("13 - Mobile webinar", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/audit/31-mobile-webinar-top.png",
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/audit/32-mobile-webinar-mid.png",
      fullPage: false,
    });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/audit/33-mobile-webinar-bottom.png",
      fullPage: false,
    });
  });

  test("14 - Mobile assessment", async ({ page }) => {
    await page.goto("/assessment");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/audit/34-mobile-assessment.png", fullPage: false });
  });

  test("15 - Mobile pricing", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/35-mobile-pricing.png", fullPage: false });
  });

  test("16 - Mobile community", async ({ page }) => {
    await page.goto("/community");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/audit/36-mobile-community.png", fullPage: false });
  });
});
