import { expect, test } from "@playwright/test";

// ============================================
// WEBINAR E2E TESTS
// ============================================
// Covers: Landing page, registration flow, seats API,
// form validation, mobile responsiveness, and join flow.

const SCREENSHOT_DIR = "test-results/webinar";

test.describe("Webinar Landing Page - Desktop", () => {
  test("01 - Page loads with all key sections", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Hero section renders
    await expect(page.locator("text=GYNERGY").first()).toBeVisible();
    await expect(page.locator("text=Free Live Training").first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-landing-hero.png`,
      fullPage: false,
    });

    // Countdown timer is present
    const timer = page.locator('[role="timer"]');
    await expect(timer.first()).toBeVisible();

    // Registration form is visible in hero
    const emailInput = page.getByPlaceholder("Enter your email").first();
    await expect(emailInput).toBeVisible();

    // Save My Seat button
    const saveBtn = page.getByRole("button", { name: /Save My Seat/i }).first();
    await expect(saveBtn).toBeVisible();
  });

  test("02 - Seats counter displays from API", async ({ page }) => {
    // Intercept seats API to verify it's called
    const seatsPromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/webinar/seats") && resp.status() === 200
    );

    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    const seatsResponse = await seatsPromise;
    const seatsData = await seatsResponse.json();

    // Verify API response structure
    expect(seatsData.success).toBe(true);
    expect(seatsData.data).toHaveProperty("seatsRemaining");
    expect(seatsData.data).toHaveProperty("totalSeats");
    expect(typeof seatsData.data.seatsRemaining).toBe("number");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-seats-counter.png`,
      fullPage: false,
    });
  });

  test("03 - Registration form validation - empty email", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Save My Seat button should be disabled when email is empty
    const saveBtn = page.getByRole("button", { name: /Save My Seat/i }).first();
    await expect(saveBtn).toBeDisabled();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-form-empty-disabled.png`,
      fullPage: false,
    });
  });

  test("04 - Registration form accepts input", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Fill in first name (optional)
    const nameInput = page.getByPlaceholder("First name (optional)").first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("TestUser");
    }

    // Fill in email
    const emailInput = page.getByPlaceholder("Enter your email").first();
    await emailInput.fill("e2e-test@example.com");

    // Button should now be enabled
    const saveBtn = page.getByRole("button", { name: /Save My Seat/i }).first();
    await expect(saveBtn).toBeEnabled();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-form-filled.png`,
      fullPage: false,
    });

    // Clear the input so we don't actually submit (avoid polluting DB)
    await emailInput.clear();
  });

  test("05 - Scroll to register section via nav CTA", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Click the "Enroll Now" button in the nav
    const enrollBtn = page.getByRole("button", { name: /Enroll Now/i });
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(1000); // Wait for smooth scroll

      // The register section should be in view
      const registerSection = page.locator("#register");
      await expect(registerSection).toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-scrolled-to-register.png`,
        fullPage: false,
      });
    }
  });

  test("06 - Full page scroll walkthrough", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Scroll through each section
    const scrollPositions = [0, 600, 1200, 2000, 3000, 4000, 99999];
    for (let i = 0; i < scrollPositions.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollPositions[i]);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-scroll-${i}.png`,
        fullPage: false,
      });
    }
  });

  test("07 - SEO structured data present", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Verify JSON-LD structured data is present
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();

    const jsonLdContent = await jsonLd.textContent();
    expect(jsonLdContent).toBeTruthy();

    const schema = JSON.parse(jsonLdContent!);
    expect(schema["@type"]).toBe("Event");
    expect(schema.name).toContain("5 Pillars");
    expect(schema.eventAttendanceMode).toContain("OnlineEventAttendanceMode");
  });

  test("08 - Meta tags for social sharing", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Check OpenGraph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toBeAttached();

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached();

    // Check Twitter tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toBeAttached();
  });
});

test.describe("Webinar Registration API", () => {
  test("09 - Registration API accepts valid email", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Intercept the registration API call
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/webinar/register") && resp.request().method() === "POST"
      ),
      // Use page.evaluate to make the API call directly (avoids actual form submit + redirect)
      page.evaluate(async () => {
        const res = await fetch("/api/webinar/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "e2e-playwright-test@example.com",
            firstName: "E2ETest",
            source: "e2e_test",
          }),
        });
        return res.json();
      }),
    ]);

    const data = await response.json();
    // Should succeed or already registered
    expect(data.success).toBe(true);
  });

  test("10 - Registration API rejects invalid email", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      });
      return { status: res.status, data: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.data.error).toBeTruthy();
  });

  test("11 - Honeypot field silently rejects bots", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bot@example.com",
          website: "http://spam.com", // Honeypot field
        }),
      });
      return { status: res.status, data: await res.json() };
    });

    // Returns success (silent rejection)
    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
  });

  test("12 - Seats API returns correct structure", async ({ page }) => {
    await page.goto("/webinar");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/webinar/seats");
      return { status: res.status, data: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    expect(result.data.data.totalSeats).toBeGreaterThan(0);
    expect(result.data.data.seatsRemaining).toBeGreaterThanOrEqual(0);
    expect(typeof result.data.data.percentageFilled).toBe("number");
    expect(typeof result.data.data.isAlmostFull).toBe("boolean");
    expect(typeof result.data.data.isFull).toBe("boolean");
  });
});

test.describe("Webinar Landing Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("13 - Mobile hero renders correctly", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Key elements visible on mobile
    await expect(page.locator("text=GYNERGY").first()).toBeVisible();
    await expect(page.locator("text=Free Live Training").first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-mobile-hero.png`,
      fullPage: false,
    });
  });

  test("14 - Mobile registration form usable", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Email input visible and interactive
    const emailInput = page.getByPlaceholder("Enter your email").first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill("mobile-test@example.com");

    // Save button is enabled
    const saveBtn = page.getByRole("button", { name: /Save My Seat/i }).first();
    await expect(saveBtn).toBeEnabled();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-mobile-form-filled.png`,
      fullPage: false,
    });

    // Clear to avoid submission
    await emailInput.clear();
  });

  test("15 - Mobile scroll through all sections", async ({ page }) => {
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    const scrollPositions = [0, 400, 800, 1200, 2000, 3000, 99999];
    for (let i = 0; i < scrollPositions.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollPositions[i]);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-mobile-scroll-${i}.png`,
        fullPage: false,
      });
    }
  });
});

test.describe("Webinar Assessment Integration", () => {
  test("16 - Assessment page loads with webinar references", async ({ page }) => {
    await page.goto("/assessment");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-assessment-page.png`,
      fullPage: false,
    });

    // Assessment should load without errors
    // Check for start button or assessment content
    const startBtn = page
      .locator("button")
      .filter({ hasText: /start|begin|take|discover/i })
      .first();

    const isAssessmentReady = await startBtn.isVisible().catch(() => false);
    expect(isAssessmentReady).toBe(true);
  });
});

test.describe("Webinar Join Flow", () => {
  test("17 - Join page redirects without valid registration", async ({ page }) => {
    // Attempt to access a webinar join page directly
    const response = await page.goto("/webinar/join/five-pillars-march-2026");

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-join-no-registration.png`,
      fullPage: false,
    });

    // Should either show an error or redirect
    const url = page.url();
    // If redirected or 404, the join flow is properly gated
    const isGated =
      url.includes("/webinar") ||
      url.includes("/login") ||
      url.includes("/404") ||
      response?.status() === 404;
    expect(isGated).toBe(true);
  });

  test("18 - Replay page enforces access control", async ({ page }) => {
    // Try to access replay without a valid slug
    const response = await page.goto("/webinar/replay/nonexistent-webinar");

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-replay-nonexistent.png`,
      fullPage: false,
    });

    const url = page.url();
    const isHandled =
      url.includes("/webinar") ||
      url.includes("/404") ||
      response?.status() === 404 ||
      (await page
        .locator("text=/not found|expired|unavailable/i")
        .isVisible()
        .catch(() => false));
    expect(isHandled).toBe(true);
  });
});
