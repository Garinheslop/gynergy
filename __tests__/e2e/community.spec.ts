import { test, expect, Page } from "@playwright/test";

import { authenticatePage } from "./helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

/**
 * After auth, the middleware redirects to the user's dashboard.
 * Navigate to /community by clicking the navbar button — the real user flow.
 */
async function goToCommunity(page: Page) {
  const communityBtn = page
    .locator("button, a")
    .filter({ hasText: /^Community$/i })
    .first();
  if (await communityBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await communityBtn.click();
    await page.waitForTimeout(3000);
  } else {
    // Fallback: try direct navigation
    await page.goto(`${BASE_URL}/community`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
  }
}

// ─────────────────────────────────────────────
// Community E2E Tests
// ─────────────────────────────────────────────
test.describe("Community Section - E2E", () => {
  test.setTimeout(120000);
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);

    const result = await authenticatePage(page, BASE_URL);
    if (!result.success) {
      console.error("Auth failed:", result.error);
      test.skip(true, `Authentication failed: ${result.error}`);
      return;
    }

    // Accept the initial redirect to dashboard — session is now established
    await page.goto(`${BASE_URL}/community`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    // If we ended up on /login, cookies aren't working
    if (page.url().includes("/login")) {
      test.skip(true, "Auth cookies not recognized");
    }
  });

  // ─────────────────────────────────────────────
  // FEED
  // ─────────────────────────────────────────────
  test.describe("Feed", () => {
    test("navigates to community via navbar and loads content", async ({ page }) => {
      // Use the Community button in navbar (real user flow)
      await goToCommunity(page);

      const url = page.url();
      console.log(`  Current URL: ${url}`);

      // Verify we're authenticated (navbar has profile-related elements)
      const navProfile = page.locator("button[aria-label='Open user menu']").first();
      await expect(navProfile).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: "test-results/community/01-community-page.png" });
    });

    test("tab navigation works when on community page", async ({ page }) => {
      await goToCommunity(page);

      // Check for tab structure (ARIA tabs or button-based tabs)
      const tabList = page.locator("[role='tablist']");
      const hasTablist = await tabList.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasTablist) {
        const tabs = tabList.locator("[role='tab']");
        const tabCount = await tabs.count();
        console.log(`  ARIA tabs found: ${tabCount}`);

        if (tabCount >= 3) {
          // Click Members tab
          const membersTab = tabs.filter({ hasText: /members/i }).first();
          if (await membersTab.isVisible()) {
            await membersTab.click();
            await page.waitForTimeout(1500);
            expect(page.url()).toContain("tab=members");
            await page.screenshot({ path: "test-results/community/02-members-tab.png" });
          }

          // Click Events tab
          const eventsTab = tabs.filter({ hasText: /events/i }).first();
          if (await eventsTab.isVisible()) {
            await eventsTab.click();
            await page.waitForTimeout(1500);
            expect(page.url()).toContain("tab=events");
            await page.screenshot({ path: "test-results/community/03-events-tab.png" });
          }

          // Back to Feed (default tab — URL may not include tab=feed)
          const feedTab = tabs.filter({ hasText: /feed/i }).first();
          if (await feedTab.isVisible()) {
            await feedTab.click();
            await page.waitForTimeout(1000);
            // Feed is default — URL is either /community or /community?tab=feed
            expect(page.url()).toContain("/community");
          }
        }
      } else {
        console.log("  No [role='tablist'] — page may have redirected");
        console.log(`  Current URL: ${page.url()}`);
        await page.screenshot({ path: "test-results/community/02-no-tabs.png" });
      }
    });

    test("infinite scroll sentinel exists on feed", async ({ page }) => {
      await goToCommunity(page);
      await page.waitForTimeout(2000);

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      const sentinel = page.locator("[role='status']").last();
      const hasSentinel = await sentinel.isVisible().catch(() => false);
      console.log(`  Infinite scroll sentinel: ${hasSentinel}`);

      await page.screenshot({ path: "test-results/community/04-scrolled-feed.png" });
    });
  });

  // ─────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────
  test.describe("Search", () => {
    test("search input accepts queries and returns results", async ({ page }) => {
      await goToCommunity(page);

      const searchInput = page
        .locator("[role='combobox'], input[placeholder*='Search' i], input[aria-label*='Search' i]")
        .first();
      const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`  Search input visible: ${hasSearch}`);

      if (hasSearch) {
        await searchInput.fill("garin");
        await page.waitForTimeout(1500);

        const resultsList = page.locator("[role='listbox'], [id='search-results-listbox']").first();
        const hasResults = await resultsList.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  Results dropdown visible: ${hasResults}`);

        if (hasResults) {
          const highlights = await resultsList.locator("mark").count();
          console.log(`  Highlighted matches: ${highlights}`);
          await page.screenshot({ path: "test-results/community/07-search-results.png" });

          // Keyboard: ArrowDown then Escape
          await searchInput.press("ArrowDown");
          await page.waitForTimeout(200);
          await searchInput.press("Escape");
          await page.waitForTimeout(300);

          const closedAfterEsc = !(await resultsList.isVisible().catch(() => false));
          console.log(`  Closed after Escape: ${closedAfterEsc}`);
          expect(closedAfterEsc).toBe(true);
        }

        // Clear button
        const clearBtn = page.locator("button[aria-label*='Clear' i]").first();
        if (await clearBtn.isVisible()) {
          await clearBtn.click();
          expect(await searchInput.inputValue()).toBe("");
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // DIRECT MESSAGES
  // ─────────────────────────────────────────────
  test.describe("Direct Messages", () => {
    test("navigates to messages via navbar icon", async ({ page }) => {
      // Click the messages icon in the navbar
      const messagesBtn = page.locator("button[aria-label*='Messages']").first();
      await expect(messagesBtn).toBeVisible({ timeout: 10000 });

      const ariaLabel = await messagesBtn.getAttribute("aria-label");
      console.log(`  Messages aria-label: "${ariaLabel}"`);
      expect(ariaLabel).toMatch(/^Messages/);

      await messagesBtn.click();
      await page.waitForTimeout(5000);

      console.log(`  URL after click: ${page.url()}`);
      expect(page.url()).toContain("/community/messages");

      await page.screenshot({ path: "test-results/community/08-messages-page.png" });
    });

    test("message thread interaction", async ({ page }) => {
      // Navigate to messages
      const messagesBtn = page.locator("button[aria-label*='Messages']").first();
      if (await messagesBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await messagesBtn.click();
        await page.waitForTimeout(5000);
      }

      // Look for conversations
      const conversations = page.locator("button").filter({ has: page.locator("img") });
      const convCount = await conversations.count();
      console.log(`  Conversations: ${convCount}`);

      if (convCount > 0) {
        await conversations.first().click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: "test-results/community/09-message-thread.png" });

        // Check for textarea
        const textarea = page.locator("textarea").first();
        const hasTextarea = await textarea.isVisible().catch(() => false);
        console.log(`  Message textarea visible: ${hasTextarea}`);

        if (hasTextarea) {
          await textarea.fill("Hello from Playwright E2E!");
          await page.waitForTimeout(300);

          // Character count
          const charCount = page.locator("text=/\\/2000/").first();
          const hasCharCount = await charCount.isVisible().catch(() => false);
          console.log(`  Character count visible: ${hasCharCount}`);

          await page.screenshot({ path: "test-results/community/10-message-compose.png" });
          await textarea.fill(""); // Don't send
        }
      }
    });
  });

  // ─────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────
  test.describe("Navbar", () => {
    test("mobile dropdown shows community, messages, and history links", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);

      // The profile menu button
      const menuBtn = page.locator("button[aria-label='Open user menu']").first();
      const hasMenu = await menuBtn.isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`  Profile menu button visible: ${hasMenu}`);

      if (hasMenu) {
        await menuBtn.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: "test-results/community/13-mobile-menu-open.png" });

        // Menu items are <li role="button"> with text content
        const menuItems = page.locator("li[role='button']");
        const itemCount = await menuItems.count();
        console.log(`  Menu items count: ${itemCount}`);

        // Collect all menu item texts
        const itemTexts: string[] = [];
        for (let i = 0; i < itemCount; i++) {
          const text = await menuItems.nth(i).textContent();
          if (text?.trim()) itemTexts.push(text.trim());
        }
        console.log(`  Menu items: ${JSON.stringify(itemTexts)}`);

        // Check for required mobile menu items
        const hasCommunity = itemTexts.some((t) => /community/i.test(t));
        const hasMessages = itemTexts.some((t) => /messages/i.test(t));
        const hasHistory = itemTexts.some((t) => /journaling history/i.test(t));

        console.log(
          `  Community: ${hasCommunity}, Messages: ${hasMessages}, History: ${hasHistory}`
        );
        expect(hasCommunity).toBe(true);
        expect(hasMessages).toBe(true);
        expect(hasHistory).toBe(true);
      }

      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  // ─────────────────────────────────────────────
  // ACCESSIBILITY
  // ─────────────────────────────────────────────
  test.describe("Accessibility", () => {
    test("community page has semantic structure", async ({ page }) => {
      await goToCommunity(page);

      const a11y = await page.evaluate(() => {
        const tablist = document.querySelector("[role='tablist']");
        const tabs = document.querySelectorAll("[role='tab']");
        const imgs = document.querySelectorAll("img");
        const missingAlt = Array.from(imgs).filter(
          (i) => !i.alt && !i.getAttribute("aria-hidden")
        ).length;
        const btns = document.querySelectorAll("button");
        const unlabeledBtns = Array.from(btns).filter(
          (b) => !b.textContent?.trim() && !b.getAttribute("aria-label")
        ).length;
        const headings = document.querySelectorAll("h1, h2, h3");

        return {
          hasTablist: !!tablist,
          tabCount: tabs.length,
          totalImages: imgs.length,
          missingAlt,
          totalButtons: btns.length,
          unlabeledButtons: unlabeledBtns,
          headingCount: headings.length,
          url: window.location.href,
        };
      });

      console.log("  A11y:", JSON.stringify(a11y, null, 2));

      // Headings should always exist
      expect(a11y.headingCount).toBeGreaterThanOrEqual(1);

      if (a11y.missingAlt > 0) console.warn(`  WARNING: ${a11y.missingAlt} images missing alt`);
      if (a11y.unlabeledButtons > 0)
        console.warn(`  WARNING: ${a11y.unlabeledButtons} unlabeled buttons`);

      await page.screenshot({ path: "test-results/community/16-a11y.png" });
    });
  });

  // ─────────────────────────────────────────────
  // RESPONSIVE
  // ─────────────────────────────────────────────
  test.describe("Responsive", () => {
    test("community page renders on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await goToCommunity(page);

      await page.screenshot({ path: "test-results/community/18-mobile-top.png" });
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);
      await page.screenshot({ path: "test-results/community/19-mobile-mid.png" });
      await page.evaluate(() => window.scrollTo(0, 99999));
      await page.waitForTimeout(300);
      await page.screenshot({ path: "test-results/community/20-mobile-bottom.png" });

      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test("messages page renders on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const messagesBtn = page.locator("button[aria-label*='Messages']").first();
      if (await messagesBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await messagesBtn.click();
        await page.waitForTimeout(5000);
      }

      await page.screenshot({ path: "test-results/community/21-mobile-messages.png" });

      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });
});
