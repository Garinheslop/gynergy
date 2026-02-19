/**
 * WEBINAR CONFIGURATION — Single Source of Truth
 *
 * ALL webinar date, time, capacity, and title references
 * should import from this file. Never hardcode these values.
 *
 * To change the webinar date/time for a new event:
 * 1. Update the values below
 * 2. Run `npx tsc --noEmit` to verify
 * 3. That's it — all pages, APIs, emails, and content update automatically
 */

// ============================================
// CORE EVENT CONFIG
// ============================================

/** Webinar slug — must match the database seed in webinars table */
export const WEBINAR_SLUG = "five-pillars-march-2026";

/** Webinar title — used in emails, landing page, schema.org */
export const WEBINAR_TITLE = "The 5 Pillars of Integrated Power";

/** Webinar description */
export const WEBINAR_DESCRIPTION =
  "Free Live Training: Why successful men feel empty and the 10-minute practice that changes everything.";

/** Start time in ISO 8601 with timezone offset */
export const WEBINAR_START_ISO = "2026-03-03T17:30:00-08:00";

/** End time in ISO 8601 with timezone offset */
export const WEBINAR_END_ISO = "2026-03-03T19:00:00-08:00";

/** Duration in minutes */
export const WEBINAR_DURATION_MINUTES = 90;

/** Maximum seats for landing page scarcity messaging */
export const WEBINAR_MAX_SEATS = 100;

// ============================================
// DERIVED VALUES (computed from core config)
// ============================================

/** Start date as Date object */
export const WEBINAR_START_DATE = new Date(WEBINAR_START_ISO);

/** Just the date portion: "2026-03-03" */
export const WEBINAR_DATE_ONLY = WEBINAR_START_ISO.split("T")[0];

/** Human-readable date: "March 3, 2026" */
export const WEBINAR_DATE_DISPLAY = WEBINAR_START_DATE.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

/** Human-readable time: "5:30 PM PST" */
export const WEBINAR_TIME_DISPLAY = WEBINAR_START_DATE.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
  timeZoneName: "short",
});

/** Short date for copy: "March 3rd" */
export const WEBINAR_DATE_SHORT = (() => {
  const day = WEBINAR_START_DATE.getDate();
  const month = WEBINAR_START_DATE.toLocaleDateString("en-US", {
    month: "long",
    timeZone: "America/Los_Angeles",
  });
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  return `${month} ${day}${suffix}`;
})();

/** Full display: "March 3, 2026 @ 5:30pm PST" */
export const WEBINAR_FULL_DISPLAY = `${WEBINAR_DATE_DISPLAY} @ ${WEBINAR_TIME_DISPLAY}`;
