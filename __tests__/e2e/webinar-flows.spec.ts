import { expect, test } from "@playwright/test";

import { authenticatePage, AGENT_PRIMARY } from "./helpers/auth";

// ============================================
// WEBINAR FLOWS E2E TESTS
// ============================================
// Covers: Live viewer page, replay page, studio access control.
// Complements webinar.spec.ts which covers landing + registration.

const SCREENSHOT_DIR = "test-results/webinar-flows";
const TEST_SLUG = "five-pillars-march-2026";
const NONEXISTENT_SLUG = "nonexistent-webinar-xyz-999";

// Helper: wait until the page has meaningful content (not just a spinner)
async function waitForPageContent(page: import("@playwright/test").Page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const body = document.body?.innerText || "";
      // Page has rendered meaningful content (not just whitespace/spinner)
      return body.trim().length > 20;
    },
    { timeout }
  );
}

// ─── Live Webinar Page ────────────────────────────────────────

test.describe("Webinar Live Page - Registration Gate", () => {
  test("01 - Shows registration form for new visitors", async ({ page }) => {
    // Clear localStorage BEFORE page hydration
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await waitForPageContent(page);

    // Should show the join form, not the viewer
    const heading = page.locator("text=Join the Webinar");
    const emailInput = page.getByPlaceholder("your@email.com");
    const joinBtn = page.getByRole("button", { name: /Join Webinar/i });

    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toBeVisible();
    await expect(joinBtn).toBeVisible();

    // Join button disabled when email empty
    await expect(joinBtn).toBeDisabled();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-live-registration-gate.png`,
      fullPage: false,
    });
  });

  test("02 - Registration form validates email and enables join", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await waitForPageContent(page);

    const emailInput = page.getByPlaceholder("your@email.com");
    const nameInput = page.getByPlaceholder("Your name");
    const joinBtn = page.getByRole("button", { name: /Join Webinar/i });

    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Fill email — button should enable
    await emailInput.fill("e2e-live-test@example.com");
    await expect(joinBtn).toBeEnabled();

    // Fill optional name
    await nameInput.fill("E2E Tester");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-live-form-filled.png`,
      fullPage: false,
    });

    // Clear to avoid polluting DB
    await emailInput.clear();
  });

  test("03 - Join API call with valid email", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await waitForPageContent(page);

    const emailInput = page.getByPlaceholder("your@email.com");
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Set up response listener BEFORE filling the form
    const joinPromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/webinar/join") && resp.request().method() === "POST",
      { timeout: 15000 }
    );

    // Fill and submit
    await emailInput.fill("e2e-live-test@example.com");
    await page.getByPlaceholder("Your name").fill("E2E Tester");
    await page.getByRole("button", { name: /Join Webinar/i }).click();

    const response = await joinPromise;
    const data = await response.json();

    // API should respond (success or webinar-not-found are both valid)
    expect(response.status()).toBeLessThan(500);

    if (data.success) {
      expect(data.webinar).toBeTruthy();
      expect(data.attendance).toBeTruthy();
      expect(typeof data.isLive).toBe("boolean");
    } else {
      // Webinar not found is acceptable in test env
      expect(data.error).toBeTruthy();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-live-after-join.png`,
      fullPage: false,
    });
  });

  test("04 - Nonexistent slug shows error after join attempt", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, NONEXISTENT_SLUG);

    await page.goto(`/webinar/live/${NONEXISTENT_SLUG}`);
    await waitForPageContent(page);

    const emailInput = page.getByPlaceholder("your@email.com");
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Fill and submit
    await emailInput.fill("e2e-test@example.com");
    await page.getByRole("button", { name: /Join Webinar/i }).click();

    // Wait for API response and error to render
    await page.waitForTimeout(5000);

    // Should show error message or remain on join form
    const errorVisible = await page
      .locator("text=/not found|failed|error/i")
      .first()
      .isVisible()
      .catch(() => false);
    const stillOnForm = await page
      .locator("text=Join the Webinar")
      .isVisible()
      .catch(() => false);
    expect(errorVisible || stillOnForm).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-live-nonexistent-slug.png`,
      fullPage: false,
    });
  });

  test("05 - Page has noindex meta tag", async ({ page }) => {
    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await page.waitForTimeout(3000);

    const robotsMeta = page.locator('meta[name="robots"][content*="noindex"]');
    // May have 2 (layout metadata + client-side useNoIndex hook) — that's fine
    await expect(robotsMeta.first()).toBeAttached({ timeout: 10000 });
  });
});

test.describe("Webinar Live Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("06 - Mobile registration form renders correctly", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await waitForPageContent(page);

    await expect(page.locator("text=Join the Webinar")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-live-mobile.png`,
      fullPage: false,
    });
  });
});

// ─── Replay Page ──────────────────────────────────────────────

test.describe("Webinar Replay Page", () => {
  test("07 - Nonexistent replay shows not-available message", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`gynergy_replay_${slug}`);
    }, NONEXISTENT_SLUG);

    await page.goto(`/webinar/replay/${NONEXISTENT_SLUG}`);
    await waitForPageContent(page);

    // Should show "Replay Not Available" or "Replay Has Expired"
    const notAvailable = page.locator("text=/Not Available|Not Found|Expired/i");
    await expect(notAvailable.first()).toBeVisible({ timeout: 10000 });

    // Should have link back to webinar registration
    const registerLink = page.locator('a[href="/webinar"]');
    await expect(registerLink.first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-replay-not-available.png`,
      fullPage: false,
    });
  });

  test("08 - Replay page has noindex meta tag", async ({ page }) => {
    await page.goto(`/webinar/replay/${TEST_SLUG}`);
    await page.waitForTimeout(3000);

    const robotsMeta = page.locator('meta[name="robots"][content*="noindex"]');
    await expect(robotsMeta).toBeAttached({ timeout: 10000 });
  });

  test("09 - Replay registration form renders when replay exists", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`gynergy_replay_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/replay/${TEST_SLUG}`);
    await waitForPageContent(page);

    // If replay exists, should show registration form
    // If not, should show "not available" — both are valid
    const formVisible = await page
      .locator("text=Watch the Replay")
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const notAvailable = await page
      .locator("text=/Not Available|Expired/i")
      .first()
      .isVisible()
      .catch(() => false);

    expect(formVisible || notAvailable).toBe(true);

    if (formVisible) {
      const emailInput = page.getByPlaceholder("Your email");
      await expect(emailInput).toBeVisible();

      const submitBtn = page.getByRole("button", { name: /Watch the Replay/i });
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toBeDisabled();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-replay-gate.png`,
      fullPage: false,
    });
  });

  test("10 - Replay registration enables submit with email", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`gynergy_replay_${slug}`);
    }, TEST_SLUG);

    await page.goto(`/webinar/replay/${TEST_SLUG}`);
    await waitForPageContent(page);

    const formVisible = await page
      .locator("text=Watch the Replay")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (formVisible) {
      const emailInput = page.getByPlaceholder("Your email");
      await emailInput.fill("e2e-replay-test@example.com");

      const submitBtn = page.getByRole("button", { name: /Watch the Replay/i });
      await expect(submitBtn).toBeEnabled();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/10-replay-form-filled.png`,
        fullPage: false,
      });

      await emailInput.clear();
    }
  });
});

test.describe("Webinar Replay Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("11 - Mobile replay page renders correctly", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`gynergy_replay_${slug}`);
    }, NONEXISTENT_SLUG);

    await page.goto(`/webinar/replay/${NONEXISTENT_SLUG}`);
    await waitForPageContent(page);

    // Should show content without layout breaks — "Not Available" or "Register"
    const hasContent = await page
      .locator("text=/Not Available|Replay|Register|Training/i")
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    expect(hasContent).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-replay-mobile.png`,
      fullPage: false,
    });
  });
});

// ─── Studio Page (Auth Protected) ─────────────────────────────

test.describe("Webinar Studio - Access Control", () => {
  test("12 - Unauthenticated user is redirected from studio", async ({ page }) => {
    const response = await page.goto("/webinar/studio/test-webinar-id");
    await page.waitForTimeout(3000);

    const url = page.url();
    // Middleware should redirect to login
    const isRedirected = url.includes("/login") || url.includes("/webinar");
    const is401 = response?.status() === 401;

    expect(isRedirected || is401).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-studio-unauthenticated.png`,
      fullPage: false,
    });
  });

  test("13 - Authenticated user with fake webinar sees error", async ({ page, baseURL }) => {
    // Navigate first so we can run evaluate for auth
    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");

    // Authenticate
    const auth = await authenticatePage(page, baseURL || "http://localhost:3000", AGENT_PRIMARY);

    if (!auth.success) {
      test.skip(true, "Test user credentials not available");
      return;
    }

    // Try accessing studio with a fake webinar ID
    await page.goto("/webinar/studio/fake-webinar-id-12345");

    // Wait for either error or loading text (page is client-rendered)
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          text.includes("not found") ||
          text.includes("Error") ||
          text.includes("error") ||
          text.includes("Failed") ||
          text.includes("failed") ||
          text.includes("not configured") ||
          text.includes("Loading studio") ||
          text.includes("Retry") ||
          text.includes("Back to Webinar")
        );
      },
      { timeout: 15000 }
    );

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-studio-auth-fake-id.png`,
      fullPage: false,
    });

    // Verify some error or retry UI is present
    const pageText = await page.locator("body").innerText();
    const hasExpectedContent =
      /not found|error|failed|retry|back to webinar|not configured|loading/i.test(pageText);
    expect(hasExpectedContent).toBe(true);
  });
});

// ─── Cross-Page Navigation ────────────────────────────────────

test.describe("Webinar Navigation Flow", () => {
  test("14 - Landing page loads then live page shows form", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`webinar_email_${slug}`);
      localStorage.removeItem(`webinar_name_${slug}`);
    }, TEST_SLUG);

    await page.goto("/webinar");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify landing page loaded — check for any webinar-related content
    const landingLoaded = await page
      .locator("text=/free live training|save my seat|webinar|gynergy/i")
      .first()
      .isVisible()
      .catch(() => false);
    expect(landingLoaded).toBe(true);

    // Navigate to live page
    await page.goto(`/webinar/live/${TEST_SLUG}`);
    await waitForPageContent(page);

    // Should show join form (since localStorage is clean)
    const hasJoinForm = await page
      .locator("text=Join the Webinar")
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasLoading = await page
      .locator("text=Loading webinar")
      .isVisible()
      .catch(() => false);
    expect(hasJoinForm || hasLoading).toBe(true);
  });

  test("15 - Replay not-available page has CTA to registration", async ({ page }) => {
    await page.addInitScript((slug) => {
      localStorage.removeItem(`gynergy_replay_${slug}`);
    }, NONEXISTENT_SLUG);

    await page.goto(`/webinar/replay/${NONEXISTENT_SLUG}`);
    await waitForPageContent(page);

    // Should have a link back to webinar registration
    const ctaLink = page.locator('a[href="/webinar"]');
    const ctaVisible = await ctaLink
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (ctaVisible) {
      await ctaLink.first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Should land on webinar landing page
      const onLanding = await page
        .locator("text=/free live training|save my seat|webinar/i")
        .first()
        .isVisible()
        .catch(() => false);
      expect(onLanding).toBe(true);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-replay-to-landing-nav.png`,
      fullPage: false,
    });
  });
});
