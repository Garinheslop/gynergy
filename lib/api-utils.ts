/**
 * API Utilities for standardized responses and error handling
 */

import { NextResponse } from "next/server";

import { createLogger } from "./logger";

const logger = createLogger("api");

// Standard API response types
interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  requestId?: string;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error API response
 * Sanitizes error messages to prevent information leakage in production
 */
export function errorResponse(
  error: unknown,
  status = 500,
  publicMessage?: string,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  // Extract error details for logging
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log the full error details
  logger.error("API error", {
    message: errorMessage,
    stack: errorStack,
    status,
    requestId,
  });

  // Return sanitized error to client
  const isProduction = process.env.NODE_ENV === "production";
  const clientMessage = isProduction
    ? publicMessage || getGenericMessage(status)
    : publicMessage || errorMessage;

  return NextResponse.json(
    {
      success: false,
      error: clientMessage,
      requestId,
    },
    { status }
  );
}

/**
 * Get generic error message based on status code
 */
function getGenericMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 429:
      return "Too many requests";
    case 500:
    default:
      return "An unexpected error occurred";
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error: unknown) => {
    return errorResponse(error, 500) as NextResponse<ApiResponse<T>>;
  });
}

/**
 * Extract and validate pagination params from URL
 */
export function getPaginationParams(
  url: URL,
  defaults: { limit: number; offset: number } = { limit: 20, offset: 0 }
): { limit: number; offset: number } {
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  let limit = defaults.limit;
  let offset = defaults.offset;

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      limit = parsed;
    }
  }

  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { limit, offset };
}
