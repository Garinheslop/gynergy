import { Page } from "@playwright/test";
import dayjs from "dayjs";

import { apiCall } from "./auth";

// ─── Constants ────────────────────────────────────────────────
const DEFAULT_BOOK_ID = "7215727d-cefa-460e-a5a0-478ec1002d08";
const TZ = "America/New_York";
const TEST_SECRET = "gynergy-e2e-test-secret-local";
const CRON_SECRET = "gynergy-cron-2026-webinar-secret";
const TEST_EMAIL = "lifecycle-e2e-test@gynergy.com";

// ─── Types ────────────────────────────────────────────────────

export interface LifecycleTestContext {
  sessionId: string;
  enrollmentId: string;
  bookId: string;
  userId: string;
  cohortId?: string;
}

interface ActionItem {
  id: string;
  period: number;
  actionType: string;
  source?: string;
  title?: string;
}

// ─── Test API Calls ───────────────────────────────────────────

async function testApiCall(
  page: Page,
  baseUrl: string,
  body: Record<string, unknown>
): Promise<{ status: number; data: Record<string, unknown> }> {
  return apiCall(page, baseUrl, "/api/test/lifecycle-setup", {
    method: "POST",
    body,
    headers: { "x-test-secret": TEST_SECRET },
  }) as Promise<{ status: number; data: Record<string, unknown> }>;
}

// ─── Setup ────────────────────────────────────────────────────

export async function setupCohortLifecycle(
  adminPage: Page,
  userPage: Page,
  baseUrl: string,
  userId: string
): Promise<LifecycleTestContext> {
  const bookId = DEFAULT_BOOK_ID;
  const today = dayjs().format("YYYY-MM-DD");

  // 0. Pre-cleanup: remove any orphaned test sessions from previous failed runs
  await testApiCall(adminPage, baseUrl, {
    operation: "cleanup-test-sessions",
    labelPrefix: "E2E Lifecycle Test",
  }).catch(() => {
    // Best-effort — endpoint may not support this yet
  });

  // 1. Create test book_session via admin API
  const { status: createStatus, data: createData } = await apiCall(
    adminPage,
    baseUrl,
    "/api/admin/cohorts",
    {
      method: "POST",
      body: {
        action: "create",
        data: {
          bookId,
          label: `E2E Lifecycle Test ${today}`,
          startDate: today,
          maxEnrollments: 5,
        },
      },
    }
  );

  if (createStatus !== 200) {
    throw new Error(`Failed to create test session: ${JSON.stringify(createData)}`);
  }

  // Admin API returns { success, data: { id, book_id, ... }, message }
  const sessionData = createData as { data?: { id: string } };
  const sessionId = sessionData.data?.id;
  if (!sessionId)
    throw new Error(
      `No sessionId returned from admin cohort create: ${JSON.stringify(createData)}`
    );

  // 2. Enroll AGENT_A directly into the test session (bypasses auto-session-finding)
  const { status: enrollStatus, data: enrollData } = await testApiCall(adminPage, baseUrl, {
    operation: "create-enrollment",
    userId,
    bookId,
    sessionId,
  });

  if (enrollStatus !== 200) {
    throw new Error(`Failed to enroll user: ${JSON.stringify(enrollData)}`);
  }

  const enrollment = enrollData as { enrollment?: { id: string } };
  const enrollmentId = enrollment.enrollment?.id;
  if (!enrollmentId)
    throw new Error(`No enrollmentId returned from enrollment: ${JSON.stringify(enrollData)}`);

  return { sessionId, enrollmentId, bookId, userId };
}

// ─── Day Simulation ───────────────────────────────────────────

export async function simulateDay(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext,
  day: number
): Promise<void> {
  const date = dayjs()
    .subtract(day - 1, "day")
    .startOf("day")
    .toISOString();
  const { status, data } = await testApiCall(page, baseUrl, {
    operation: "set-enrollment-date",
    enrollmentId: ctx.enrollmentId,
    date,
  });
  if (status !== 200) throw new Error(`simulateDay(${day}) failed: ${JSON.stringify(data)}`);
}

// ─── Session Date Manipulation ────────────────────────────────

export async function setSessionDates(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext,
  opts: {
    startDate?: string;
    endDate?: string;
    gracePeriodEnd?: string;
    status?: string;
  }
): Promise<void> {
  const { status, data } = await testApiCall(page, baseUrl, {
    operation: "set-session-dates",
    sessionId: ctx.sessionId,
    ...opts,
  });
  if (status !== 200) throw new Error(`setSessionDates failed: ${JSON.stringify(data)}`);
}

// ─── Cleanup ──────────────────────────────────────────────────

export async function cleanupCohortLifecycle(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext
): Promise<void> {
  await testApiCall(page, baseUrl, {
    operation: "cleanup",
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    email: TEST_EMAIL,
  });
  await testApiCall(page, baseUrl, {
    operation: "delete-session",
    sessionId: ctx.sessionId,
  });
  // Restore user's original mega-session enrollment (removed during test setup)
  await testApiCall(page, baseUrl, {
    operation: "restore-enrollment",
    userId: ctx.userId,
    bookId: ctx.bookId,
  }).catch(() => {
    // Best-effort — user may not have had an original enrollment
  });
}

// ─── Actions Fetch (with timezone header) ─────────────────────

export async function fetchActions(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext
): Promise<{ status: number; actions: ActionItem[] }> {
  const { status, data } = await apiCall(
    page,
    baseUrl,
    `/api/actions/user-actions?enrollmentId=${ctx.enrollmentId}&sessionId=${ctx.sessionId}`,
    { headers: { "x-user-timezone": TZ } }
  );
  const typed = data as { actions?: ActionItem[] };
  return { status, actions: typed?.actions || [] };
}

// ─── Journal / Action Log Fetches ─────────────────────────────

export async function fetchDailyJournals(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext
): Promise<{ status: number; data: unknown }> {
  return apiCall(page, baseUrl, `/api/journals/user-daily-journals?sessionId=${ctx.sessionId}`, {
    headers: { "x-user-timezone": TZ },
  });
}

export async function fetchDailyActionLogs(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext
): Promise<{ status: number; data: unknown }> {
  return apiCall(page, baseUrl, `/api/actions/user-daily-action-logs?sessionId=${ctx.sessionId}`, {
    headers: { "x-user-timezone": TZ },
  });
}

export async function fetchEnrollment(
  page: Page,
  baseUrl: string,
  bookId: string
): Promise<{ status: number; data: unknown }> {
  return apiCall(page, baseUrl, `/api/books/user-current-book-session?bookId=${bookId}`);
}

// ─── Payload Factories ────────────────────────────────────────

export function buildMorningJournal(sessionId: string, day: number) {
  return {
    body: {
      sessionId,
      journal: {
        moodScore: 5 + (day % 5),
        capturedEssence: `Day ${day} dream essence`,
        moodContribution: `Day ${day} mood driver`,
        mantra: `Day ${day} mantra - I am growing`,
        affirmations: [
          `Day ${day} affirmation 1`,
          `Day ${day} affirmation 2`,
          `Day ${day} affirmation 3`,
          `Day ${day} affirmation 4`,
          `Day ${day} affirmation 5`,
        ],
        gratitudes: [`Day ${day} gratitude 1`, `Day ${day} gratitude 2`, `Day ${day} gratitude 3`],
        excitements: [
          `Day ${day} excitement 1`,
          `Day ${day} excitement 2`,
          `Day ${day} excitement 3`,
        ],
      },
      images: [],
    },
  };
}

export function buildEveningJournal(sessionId: string, day: number) {
  return {
    body: {
      sessionId,
      journal: {
        moodScore: 6 + (day % 4),
        insight: `Day ${day} insight`,
        insightImpact: `Day ${day} impact on perspective`,
        success: `Day ${day} win`,
        changes: `Day ${day} growth area`,
        dreammagic: [
          `Day ${day} dream 1`,
          `Day ${day} dream 2`,
          `Day ${day} dream 3`,
          `Day ${day} dream 4`,
          `Day ${day} dream 5`,
        ],
      },
      images: [],
    },
  };
}

export function buildWeeklyJournal(sessionId: string, week: number) {
  return {
    body: {
      sessionId,
      journal: {
        wins: `Week ${week} wins - built consistency`,
        challenges: `Week ${week} challenges - staying focused`,
        lessons: `Week ${week} lessons - small steps matter`,
      },
      images: [],
    },
  };
}

export function buildDGACompletion(actionId: string, sessionId: string, day: number) {
  return {
    body: {
      actionId,
      sessionId,
      actionLog: {
        isCompleted: true,
        reflection: `Day ${day} DGA reflection - felt meaningful`,
      },
      images: [],
    },
  };
}

export function buildWeeklyChallengeCompletion(actionId: string, sessionId: string, week: number) {
  const weekFields: Record<number, Record<string, string>> = {
    1: { reward: `Week ${week} self-care reward` },
    2: { motivation: `Week ${week} family connection` },
    3: { purpose: `Week ${week} career clarity` },
    4: { focus: `Week ${week} health priority` },
    5: { success: `Week ${week} relationship growth` },
    6: { reward: `Week ${week} adventure day` },
  };
  const cycledWeek = ((week - 1) % 6) + 1;
  return {
    body: {
      actionId,
      sessionId,
      actionLog: {
        isCompleted: true,
        ...(weekFields[cycledWeek] || { reward: `Week ${week} general reward` }),
      },
      images: [],
    },
  };
}

// ─── Full Day Cycle Helper ────────────────────────────────────

export async function completeDayCycle(
  page: Page,
  baseUrl: string,
  ctx: LifecycleTestContext,
  day: number,
  dailyActionId: string
): Promise<{ morning: number; dga: number; evening: number }> {
  const morning = buildMorningJournal(ctx.sessionId, day);
  const dga = buildDGACompletion(dailyActionId, ctx.sessionId, day);
  const evening = buildEveningJournal(ctx.sessionId, day);

  const { status: mStatus } = await apiCall(page, baseUrl, "/api/journals/create-morning-journal", {
    method: "POST",
    ...morning,
  });
  const { status: dStatus } = await apiCall(page, baseUrl, "/api/actions/complete-daily-action", {
    method: "POST",
    ...dga,
  });
  const { status: eStatus } = await apiCall(page, baseUrl, "/api/journals/create-evening-journal", {
    method: "POST",
    ...evening,
  });

  return { morning: mStatus, dga: dStatus, evening: eStatus };
}

export { TEST_EMAIL, TZ, DEFAULT_BOOK_ID, CRON_SECRET };
