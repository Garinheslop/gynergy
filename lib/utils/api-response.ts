// Standardized API Response Utilities
// Ensures consistent error/success response format across all API routes

import { NextResponse } from "next/server";

// Error codes for machine-readable error handling
export const ErrorCode = {
  // Client errors (4xx)
  INVALID_REQUEST: "INVALID_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// Error response structure
export interface ApiError {
  message: string;
  code: ErrorCodeType;
  details?: Record<string, unknown>;
}

// Success response structure
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    pageSize?: number;
    timestamp?: string;
  };
}

// Error response helper
export function apiError(
  message: string,
  code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  const errorResponse: { error: ApiError } = {
    error: {
      message,
      code,
      ...(details && { details }),
    },
  };

  return NextResponse.json(errorResponse, { status });
}

// Success response helper
export function apiSuccess<T>(data: T, meta?: ApiSuccess<T>["meta"]): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };

  return NextResponse.json(response);
}

// Common error responses (convenience functions)
export const ApiErrors = {
  // 400 Bad Request
  invalidRequest: (message = "Invalid request") =>
    apiError(message, ErrorCode.INVALID_REQUEST, 400),

  validationError: (message: string, details?: Record<string, unknown>) =>
    apiError(message, ErrorCode.VALIDATION_ERROR, 400, details),

  missingField: (field: string) =>
    apiError(`Missing required field: ${field}`, ErrorCode.VALIDATION_ERROR, 400, { field }),

  // 401 Unauthorized
  unauthorized: (message = "Authentication required") =>
    apiError(message, ErrorCode.UNAUTHORIZED, 401),

  // 403 Forbidden
  forbidden: (message = "Access denied") => apiError(message, ErrorCode.FORBIDDEN, 403),

  // 404 Not Found
  notFound: (resource = "Resource") => apiError(`${resource} not found`, ErrorCode.NOT_FOUND, 404),

  // 409 Conflict
  conflict: (message: string) => apiError(message, ErrorCode.CONFLICT, 409),

  // 429 Rate Limited
  rateLimited: (message = "Too many requests") => apiError(message, ErrorCode.RATE_LIMITED, 429),

  // 500 Internal Server Error
  internalError: (message = "An unexpected error occurred") =>
    apiError(message, ErrorCode.INTERNAL_ERROR, 500),

  databaseError: (message = "Database operation failed") =>
    apiError(message, ErrorCode.DATABASE_ERROR, 500),

  // 503 Service Unavailable
  serviceUnavailable: (service = "Service") =>
    apiError(`${service} is temporarily unavailable`, ErrorCode.SERVICE_UNAVAILABLE, 503),

  externalServiceError: (service: string) =>
    apiError(`${service} is unavailable`, ErrorCode.EXTERNAL_SERVICE_ERROR, 503),
};

// Parse request body with error handling
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Wrapper for API route handlers with consistent error handling
export function withErrorHandling<T>(
  handler: (request: Request, context?: T) => Promise<NextResponse>
) {
  return async (request: Request, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);

      // Don't expose internal error details in production
      const message =
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "An unexpected error occurred";

      return ApiErrors.internalError(message);
    }
  };
}
