/**
 * Agent Capabilities — Discovered State of Test Agents
 *
 * These constants reflect the ACTUAL capabilities of AGENT_PRIMARY
 * as discovered by running diagnostic tests against the live server.
 * Last verified: 2026-02-22
 *
 * If tests start failing unexpectedly, re-run diagnostic.spec.ts to verify
 * these are still accurate.
 */

/** AGENT_PRIMARY (garin@gynergy.com) IS an admin — /api/admin/stats returns 200 */
export const AGENT_PRIMARY_IS_ADMIN = true;

/** AGENT_PRIMARY has challenge access — /date-zero-gratitude dashboard loads */
export const AGENT_PRIMARY_HAS_CHALLENGE_ACCESS = true;

/** AGENT_PRIMARY does NOT have AI consent — /api/ai/chat returns 403 "ai_consent_required" */
export const AGENT_PRIMARY_HAS_AI_CONSENT = false;

/**
 * Correct API request type paths for dynamic [requestType] routes.
 * These map to the actual constant values in resources/types/*.ts
 */
export const AI_ROUTES = {
  characters: "/api/ai/characters",
  character: "/api/ai/character",
  chat: "/api/ai/chat",
  history: "/api/ai/history",
  endSession: "/api/ai/end-session",
  rateSession: "/api/ai/rate-session",
  userContext: "/api/ai/user-context",
  exportConversation: "/api/ai/export-conversation",
  suggestCharacter: "/api/ai/suggest-character",
} as const;

export const BOOK_ROUTES = {
  latestBookSessions: "/api/books/latest-book-sessions",
  userCurrentBookSession: "/api/books/user-current-book-session",
  bookEnrollment: "/api/books/book-enrollment",
  resetUserBookSession: "/api/books/reset-user-book-session",
} as const;

export const GAMIFICATION_ROUTES = {
  allBadges: "/api/gamification/all-badges",
  userBadges: "/api/gamification/user-badges",
  newBadges: "/api/gamification/new-badges",
  pointsHistory: "/api/gamification/points-history",
  totalPoints: "/api/gamification/total-points",
  markSeen: "/api/gamification/mark-seen",
  checkBadges: "/api/gamification/check-badges",
  toggleShowcase: "/api/gamification/toggle-showcase",
} as const;

export const LEADERBOARD_ROUTES = {
  leaderboardData: "/api/leaderboard/leaderboard-data",
  userRank: "/api/leaderboard/user-rank",
} as const;

export const CONTENT_ROUTES = {
  listCourses: "/api/content/list-courses",
  listContent: "/api/content/list-content",
  getCourse: "/api/content/get-course",
  createCourse: "/api/content/create-course",
  enroll: "/api/content/enroll",
  getBookmarks: "/api/content/get-bookmarks",
  addBookmark: "/api/content/add-bookmark",
} as const;

export const JOURNAL_ROUTES = {
  userDailyJournals: "/api/journals/user-daily-journals",
  createMorningJournal: "/api/journals/create-morning-journal",
  createEveningJournal: "/api/journals/create-evening-journal",
  createWeeklyJournal: "/api/journals/create-weekly-journal",
  userJournalHistory: "/api/journals/user-journal-history",
  updateJournal: "/api/journals/update-journal",
  deleteJournal: "/api/journals/delete-journal",
} as const;
