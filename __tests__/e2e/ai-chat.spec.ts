/**
 * AI Chat — E2E Tests
 *
 * Covers:
 * - AI API auth requirements (all endpoints return 401 when unauthenticated)
 * - Character listing and retrieval (GET — no consent check)
 * - Chat session lifecycle — POST endpoints blocked by consent check (403)
 * - Input validation order (consent check runs before input validation on POST)
 *
 * Known state (AGENT_PRIMARY / garin@gynergy.com):
 * - IS_ADMIN: true
 * - HAS_AI_CONSENT: false → all POST /api/ai/* return 403 "ai_consent_required"
 * - GET endpoints do NOT check AI consent
 */

import { expect, test, Page } from "@playwright/test";

import { AI_ROUTES, AGENT_PRIMARY_HAS_AI_CONSENT } from "./helpers/agent-capabilities";
import { authenticatePage, apiCall, AGENT_PRIMARY } from "./helpers/auth";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════════════
//  AI CHAT API AUTH (UNAUTHENTICATED)
//  Auth middleware runs before requestType validation, so even correct URLs
//  return 401 for unauthenticated requests.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("AI Chat - API Auth (Unauthenticated)", () => {
  test("01 - GET ai/characters requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.characters);
    expect(status).toBe(401);
  });

  test("02 - POST ai/chat requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.chat, {
      method: "POST",
      body: { message: "Hello", characterKey: "test" },
    });
    expect(status).toBe(401);
  });

  test("03 - GET ai/history requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(
      page,
      BASE_URL,
      AI_ROUTES.history + "?characterId=00000000-0000-0000-0000-000000000000"
    );
    expect(status).toBe(401);
  });

  test("04 - POST ai/end-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.endSession, {
      method: "POST",
      body: { chatSessionId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(status).toBe(401);
  });

  test("05 - POST ai/rate-session requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.rateSession, {
      method: "POST",
      body: { chatSessionId: "00000000-0000-0000-0000-000000000000", rating: 5 },
    });
    expect(status).toBe(401);
  });

  test("06 - POST ai/export-conversation requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.exportConversation, {
      method: "POST",
      body: { characterKey: "test", format: "text" },
    });
    expect(status).toBe(401);
  });

  test("07 - GET ai/suggest-character requires auth", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    const { status } = await apiCall(page, BASE_URL, AI_ROUTES.suggestCharacter);
    expect(status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  AI CHAT API (AUTHENTICATED)
//
//  AGENT_PRIMARY has NO AI consent (AGENT_PRIMARY_HAS_AI_CONSENT === false).
//  - GET endpoints do NOT check consent → return real data
//  - POST endpoints check consent FIRST (before input validation) → 403
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

  // ─── GET endpoints (no consent check) ───────────────────────

  test("08 - GET ai/characters returns character list", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.characters);

    expect(status).toBe(200);

    // Response shape: { characters: [{ key, name, role, ... }] }
    const body = data as { characters?: Array<{ key: string; name: string; role: string }> };
    expect(body).toHaveProperty("characters");
    expect(Array.isArray(body.characters)).toBe(true);
    expect(body.characters!.length).toBeGreaterThanOrEqual(1);

    // Verify at least the first character has expected shape
    const first = body.characters![0];
    expect(first).toHaveProperty("key");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("role");
  });

  test("09 - GET ai/character with key returns character data", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.character + "?key=yesi");

    expect(status).toBe(200);

    // Response shape: { character: { key, name, role, ... } }
    const body = data as { character?: { key: string; name: string; role: string } };
    expect(body).toHaveProperty("character");
    expect(body.character).toHaveProperty("key");
    expect(body.character).toHaveProperty("name");
    expect(body.character).toHaveProperty("role");
  });

  test("10 - GET ai/suggest-character returns suggestion", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.suggestCharacter);

    expect(status).toBe(200);

    // Verify response has suggestion data (shape may vary)
    expect(data).toBeTruthy();
  });

  test("11 - GET ai/user-context returns context", async () => {
    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.userContext);

    expect(status).toBe(200);

    // Response shape: { context: ..., contextString: ... }
    const body = data as { context?: unknown; contextString?: string };
    expect(body).toHaveProperty("context");
    expect(body).toHaveProperty("contextString");
  });

  // ─── POST endpoints (consent check blocks before validation) ─

  test("12 - POST ai/chat with missing message returns 403 (consent)", async () => {
    // AGENT_PRIMARY has no AI consent. Consent check runs BEFORE input validation,
    // so even with missing fields, the response is 403 "ai_consent_required".
    expect(AGENT_PRIMARY_HAS_AI_CONSENT).toBe(false);

    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.chat, {
      method: "POST",
      body: { characterKey: "test" },
    });

    expect(status).toBe(403);
    const body = data as { error?: string };
    expect(body.error).toBe("ai_consent_required");
  });

  test("13 - POST ai/chat with missing characterKey returns 403 (consent)", async () => {
    // Same as above — consent check runs first.
    expect(AGENT_PRIMARY_HAS_AI_CONSENT).toBe(false);

    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.chat, {
      method: "POST",
      body: { message: "Hello" },
    });

    expect(status).toBe(403);
    const body = data as { error?: string };
    expect(body.error).toBe("ai_consent_required");
  });

  test("14 - POST ai/end-session with fake ID returns 403 (consent)", async () => {
    expect(AGENT_PRIMARY_HAS_AI_CONSENT).toBe(false);

    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.endSession, {
      method: "POST",
      body: { chatSessionId: "00000000-0000-0000-0000-000000000000" },
    });

    expect(status).toBe(403);
    const body = data as { error?: string };
    expect(body.error).toBe("ai_consent_required");
  });

  test("15 - POST ai/rate-session with fake ID returns 403 (consent)", async () => {
    expect(AGENT_PRIMARY_HAS_AI_CONSENT).toBe(false);

    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.rateSession, {
      method: "POST",
      body: {
        chatSessionId: "00000000-0000-0000-0000-000000000000",
        rating: 5,
      },
    });

    expect(status).toBe(403);
    const body = data as { error?: string };
    expect(body.error).toBe("ai_consent_required");
  });

  test("16 - POST ai/export-conversation returns 403 (consent)", async () => {
    expect(AGENT_PRIMARY_HAS_AI_CONSENT).toBe(false);

    const { status, data } = await apiCall(authedPage, BASE_URL, AI_ROUTES.exportConversation, {
      method: "POST",
      body: {
        characterKey: "totally-fake-character",
        format: "text",
      },
    });

    expect(status).toBe(403);
    const body = data as { error?: string };
    expect(body.error).toBe("ai_consent_required");
  });

  // ─── GET endpoint (no consent check) ────────────────────────

  test("17 - GET ai/history with fake characterId returns empty or error", async () => {
    const { status, data } = await apiCall(
      authedPage,
      BASE_URL,
      AI_ROUTES.history + "?characterId=00000000-0000-0000-0000-000000000000"
    );

    // GET does not check consent. Fake characterId may return 200 with empty
    // history, or 400/404 depending on server-side validation.
    expect([200, 400, 404]).toContain(status);

    if (status === 200) {
      // If 200, expect empty history array
      const body = data as { history?: unknown[] };
      if (body.history) {
        expect(Array.isArray(body.history)).toBe(true);
      }
    }
  });
});
