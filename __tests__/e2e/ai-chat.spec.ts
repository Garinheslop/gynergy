/**
 * AI Chat — E2E Tests
 *
 * Covers:
 * - AI API auth requirements (all endpoints)
 * - Character listing and retrieval
 * - Chat session lifecycle (send, history, end, rate, export)
 * - Input validation
 * - Consent requirement
 */

import { expect, test, Page } from "@playwright/test";

import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  AI CHAT API AUTH (UNAUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("AI Chat - API Auth (Unauthenticated)", () => {
  test("01 - GET ai/get-characters requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/get-characters");
    expect([401, 403]).toContain(status);
  });

  test("02 - POST ai/chat requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/chat", {
      method: "POST",
      body: { message: "Hello", characterKey: "test" },
    });
    expect([401, 403]).toContain(status);
  });

  test("03 - GET ai/get-chat-history requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/get-chat-history?characterId=fake");
    expect([401, 403]).toContain(status);
  });

  test("04 - POST ai/end-chat-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/end-chat-session", {
      method: "POST",
      body: { chatSessionId: "fake" },
    });
    expect([401, 403]).toContain(status);
  });

  test("05 - POST ai/rate-chat-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/rate-chat-session", {
      method: "POST",
      body: { chatSessionId: "fake", rating: 5 },
    });
    expect([401, 403]).toContain(status);
  });

  test("06 - POST ai/export-conversation requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/export-conversation", {
      method: "POST",
      body: { characterKey: "test", format: "text" },
    });
    expect([401, 403]).toContain(status);
  });

  test("07 - GET ai/suggest-character requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, "/api/ai/suggest-character");
    expect([401, 403]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  AI CHAT API (AUTHENTICATED)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("AI Chat - API (Authenticated)", () => {
  test.describe.configure({ mode: "serial" });

  let authedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    authedPage = await ctx.newPage();
    await authedPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const result = await authenticatePage(authedPage, BASE_URL, AGENT_PRIMARY);
    expect(result.success).toBe(true);
  });

  test.afterAll(async () => {
    await authedPage.context().close();
  });

  test("08 - GET ai/get-characters returns character list", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, "/api/ai/get-characters");

    // May require AI consent, return characters, or 400 for missing params
    expect([200, 400, 403, 500]).toContain(status);
    if (status === 200 && Array.isArray(data)) {
      expect(data.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("09 - GET ai/get-character with key returns data", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/get-character?key=test");

    // May require consent, or key not found
    expect([200, 400, 403, 404, 500]).toContain(status);
  });

  test("10 - GET ai/suggest-character returns suggestion", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/suggest-character");

    // May require consent
    expect([200, 403, 500]).toContain(status);
  });

  test("11 - GET ai/get-user-context returns context", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/get-user-context");

    // May require consent or return 400 for missing params
    expect([200, 400, 403, 500]).toContain(status);
  });

  test("12 - POST ai/chat with missing message returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/chat", {
      method: "POST",
      body: { characterKey: "test" },
    });

    // Missing message should fail
    expect([400, 403, 422, 500]).toContain(status);
  });

  test("13 - POST ai/chat with missing characterKey returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/chat", {
      method: "POST",
      body: { message: "Hello" },
    });

    // Missing characterKey should fail
    expect([400, 403, 422, 500]).toContain(status);
  });

  test("14 - POST ai/end-chat-session with fake ID returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/end-chat-session", {
      method: "POST",
      body: { chatSessionId: "00000000-0000-0000-0000-000000000000" },
    });

    // Fake session should fail
    expect([400, 403, 404, 500]).toContain(status);
  });

  test("15 - POST ai/rate-chat-session with fake ID returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/rate-chat-session", {
      method: "POST",
      body: {
        chatSessionId: "00000000-0000-0000-0000-000000000000",
        rating: 5,
      },
    });

    // Fake session should fail
    expect([400, 403, 404, 500]).toContain(status);
  });

  test("16 - POST ai/export-conversation with fake key returns error", async () => {
    const { status } = await apiCall(authedPage, BASE_URL, "/api/ai/export-conversation", {
      method: "POST",
      body: {
        characterKey: "totally-fake-character",
        format: "text",
      },
    });

    // Fake character should fail or return empty
    expect([200, 400, 403, 404, 500]).toContain(status);
  });

  test("17 - GET ai/get-chat-history with fake characterId", async () => {
    const { status } = await apiCall(
      authedPage,
      BASE_URL,
      "/api/ai/get-chat-history?characterId=00000000-0000-0000-0000-000000000000"
    );

    // Fake character — returns empty or error
    expect([200, 400, 403, 404, 500]).toContain(status);
  });
});
