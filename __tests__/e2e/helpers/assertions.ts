/**
 * Shared E2E assertion helpers.
 * Use these instead of ad-hoc assertions to ensure consistency.
 */
import { expect } from "@playwright/test";

/** Assert API returns 401 for unauthenticated request */
export function assertAuthRequired(status: number) {
  expect(status).toBe(401);
}

/** Assert API returns 403 for forbidden request (non-admin, no consent, etc.) */
export function assertForbidden(status: number) {
  expect(status).toBe(403);
}

/** Assert response data has expected keys */
export function assertHasKeys(data: unknown, keys: string[]) {
  expect(data).toBeTruthy();
  for (const key of keys) {
    expect(data).toHaveProperty(key);
  }
}

/** Assert URL redirected to expected pattern */
export function assertRedirectedTo(url: string, pattern: string | RegExp) {
  if (typeof pattern === "string") {
    expect(url).toContain(pattern);
  } else {
    expect(url).toMatch(pattern);
  }
}
