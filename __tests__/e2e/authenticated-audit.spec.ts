import { test } from "@playwright/test";

const TEST_EMAIL = "garin@gynergy.com";
const TEST_PASSWORD = "PlaywrightTest123!";
const BASE_URL = "https://www.gynergy.app";

test.describe("Authenticated App Audit", () => {
  test.setTimeout(300000);

  test("Full authenticated walkthrough", async ({ page }) => {
    const fs = await import("node:fs");
    if (!fs.existsSync("test-results/audit")) {
      fs.mkdirSync("test-results/audit", { recursive: true });
    }

    // ============ STEP 1: LOGIN ============
    console.log("=== STEP 1: Login via email/password ===");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/audit/01-login-page.png" });

    // Sign in via Supabase REST API directly in the browser
    console.log("  Signing in via Supabase REST API...");
    const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
    const ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzgxMTIsImV4cCI6MjA1Nzg1NDExMn0.8qEL_XhWjYcLBjou_P0OjL2lpgMoSDCl2KnN04ogCsw";

    const signInResult = await page.evaluate(
      async ({ url, key, email, password }) => {
        try {
          const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: key,
            },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            return {
              success: false,
              error: data.error_description || data.msg || "Unknown error",
              status: res.status,
            };
          }
          return {
            success: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            userId: data.user?.id,
          };
        } catch (err: unknown) {
          return { success: false, error: String(err) };
        }
      },
      { url: SUPABASE_URL, key: ANON_KEY, email: TEST_EMAIL, password: TEST_PASSWORD }
    );

    console.log("  Sign-in result:", JSON.stringify(signInResult));

    if (!signInResult.success) {
      console.log("  LOGIN FAILED:", signInResult.error);
      await page.screenshot({ path: "test-results/audit/02-login-failed.png" });
      return;
    }

    // Set the Supabase session cookies in the correct format
    // Supabase SSR stores raw JSON session data, chunked by cookie size limits
    const projectRef = "lhpmebczgzizqlypzwcj";
    const cookieName = `sb-${projectRef}-auth-token`;
    const sessionData = JSON.stringify({
      access_token: signInResult.access_token,
      refresh_token: signInResult.refresh_token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: signInResult.expires_at,
    });

    const cookieBase = {
      domain: ".gynergy.app",
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax" as const,
      expires: Math.floor(Date.now() / 1000) + 3600,
    };

    // Chunk the cookie value (Supabase SSR splits at ~3180 bytes)
    const chunkSize = 3180;
    const chunks: string[] = [];
    for (let i = 0; i < sessionData.length; i += chunkSize) {
      chunks.push(sessionData.substring(i, i + chunkSize));
    }

    // Set cookies - single cookie or chunked format
    const cookiesToSet =
      chunks.length === 1
        ? [{ ...cookieBase, name: cookieName, value: chunks[0] }]
        : chunks.map((chunk, i) => ({
            ...cookieBase,
            name: `${cookieName}.${i}`,
            value: chunk,
          }));

    await page.context().addCookies(cookiesToSet);
    console.log(`  Set ${cookiesToSet.length} auth cookie(s), total size: ${sessionData.length}`);

    // Navigate to protected page
    console.log("  Navigating to dashboard...");
    await page.goto(`${BASE_URL}/date-zero-gratitude`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log("  Current URL:", currentUrl);
    await page.screenshot({ path: "test-results/audit/03-post-login.png" });

    // Handle various post-login states
    if (currentUrl.includes("/login")) {
      console.log("  LOGIN FAILED - still on login page");
      await page.screenshot({ path: "test-results/audit/03-login-failed.png" });
      return;
    }

    if (currentUrl.includes("/pricing")) {
      console.log("  Redirected to pricing - user lacks challenge access");
      await page.screenshot({ path: "test-results/audit/03-pricing-redirect.png" });
      return;
    }

    // ============ WE'RE IN! ============
    console.log("\n=== AUTHENTICATED SUCCESSFULLY ===\n");
    await page.waitForTimeout(2000);

    // ============ STEP 2: DASHBOARD ============
    console.log("=== STEP 2: Dashboard ===");
    console.log("  URL:", page.url());

    await page.screenshot({ path: "test-results/audit/10-dashboard-top.png" });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/11-dashboard-mid1.png" });
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/12-dashboard-mid2.png" });
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/audit/13-dashboard-bottom.png" });

    // Check page details
    const title = await page.title();
    console.log("  Title:", title);
    const btnCount = await page.locator("button").count();
    const linkCount = await page.locator("a").count();
    console.log("  Buttons:", btnCount, "| Links:", linkCount);

    // Check for journal input
    const journalInput = page.locator("textarea").first();
    const hasJournal = await journalInput.isVisible().catch(() => false);
    console.log("  Journal textarea visible:", hasJournal);
    if (hasJournal) {
      await journalInput.click();
      await page.screenshot({ path: "test-results/audit/14-journal-focus.png" });
    }

    // Get navigation links
    const navLinks = await page.locator("a[href]").evaluateAll((els) =>
      els
        .map((el) => ({ text: el.textContent?.trim(), href: el.getAttribute("href") }))
        .filter((l) => l.href && l.href.startsWith("/") && l.text)
        .slice(0, 20)
    );
    console.log("  Nav links:", JSON.stringify(navLinks));

    // ============ STEP 3: VISIT AUTHENTICATED PAGES ============
    console.log("\n=== STEP 3: Authenticated pages ===");

    const pages = [
      { name: "community", url: "/community" },
      { name: "library", url: "/library" },
      { name: "courses", url: "/courses" },
      { name: "admin", url: "/admin" },
      { name: "admin-webinar", url: "/admin/webinar" },
    ];

    let idx = 20;
    for (const p of pages) {
      console.log(`\n  --- ${p.name} (${p.url}) ---`);
      try {
        await page.goto(`${BASE_URL}${p.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);

        const pUrl = page.url();
        console.log(`  URL: ${pUrl}`);

        if (pUrl.includes("/login")) {
          console.log("  >>> AUTH LOST");
          await page.screenshot({ path: `test-results/audit/${idx}-${p.name}-AUTH-LOST.png` });
          idx++;
          continue;
        }
        if (pUrl.includes("/pricing")) {
          console.log("  >>> NO ACCESS");
          await page.screenshot({ path: `test-results/audit/${idx}-${p.name}-NO-ACCESS.png` });
          idx++;
          continue;
        }

        const h = await page
          .locator("h1, h2")
          .first()
          .textContent()
          .catch(() => "none");
        console.log(`  Heading: ${h}`);

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/audit/${idx}-${p.name}-top.png` });
        idx++;
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/audit/${idx}-${p.name}-mid.png` });
        idx++;
        await page.evaluate(() => window.scrollTo(0, 99999));
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/audit/${idx}-${p.name}-bottom.png` });
        idx++;
      } catch (err) {
        console.log(`  ERROR: ${(err as Error).message}`);
        idx++;
      }
    }

    // ============ STEP 4: MOBILE TEST ============
    console.log("\n=== STEP 4: Mobile viewport ===");
    await page.goto(`${BASE_URL}/date-zero-gratitude`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/audit/${idx}-mobile-dashboard.png` });
    idx++;
    await page.setViewportSize({ width: 1280, height: 720 });

    // ============ STEP 5: ACCESSIBILITY ============
    console.log("\n=== STEP 5: Accessibility ===");
    await page.goto(`${BASE_URL}/date-zero-gratitude`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const a11y = await page.evaluate(() => {
      const imgs = document.querySelectorAll("img");
      const noAlt = Array.from(imgs).filter((i) => !i.alt).length;
      const btns = document.querySelectorAll("button");
      const noLabel = Array.from(btns).filter(
        (b) => !b.textContent?.trim() && !b.getAttribute("aria-label")
      ).length;
      return {
        totalImages: imgs.length,
        missingAlt: noAlt,
        totalButtons: btns.length,
        unlabeledButtons: noLabel,
      };
    });
    console.log("  A11y:", a11y);

    await page.screenshot({ path: `test-results/audit/${idx}-final.png` });
    console.log(`\n=== AUDIT COMPLETE (${idx + 1} screenshots) ===`);
  });
});
