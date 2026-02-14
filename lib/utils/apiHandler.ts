// API Handler Wrapper
// Provides consistent error handling, logging, and response formatting

import { NextRequest, NextResponse } from "next/server";

import {
  AppError,
  AuthError,
  ValidationError,
  toAppError,
  createErrorResponse,
  ErrorResponse,
} from "@lib/errors";
import { createClient } from "@lib/supabase-server";

export interface ApiContext {
  user: {
    id: string;
    email?: string;
  } | null;
  isAdmin: boolean;
  supabase: ReturnType<typeof createClient>;
}

export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: ApiContext,
  params?: Record<string, string>
) => Promise<T>;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

/**
 * Wrap an API handler with standard error handling and auth
 */
export function withApiHandler<T>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
): (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse> {
  const { requireAuth = true, requireAdmin = false } = options;

  return async (request: NextRequest, routeContext?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const supabase = createClient();

      // Get user if auth is available
      let user: ApiContext["user"] = null;
      let isAdmin = false;

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        user = { id: authUser.id, email: authUser.email };

        // Check admin status if needed
        if (requireAdmin) {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authUser.id)
            .eq("role", "admin")
            .single();

          isAdmin = !!userRole;
        }
      }

      // Enforce auth requirement
      if (requireAuth && !user) {
        throw new AuthError();
      }

      // Enforce admin requirement
      if (requireAdmin && !isAdmin) {
        throw new AuthError("Admin access required");
      }

      const context: ApiContext = {
        user,
        isAdmin,
        supabase,
      };

      // Execute the handler
      const result = await handler(request, context, routeContext?.params);

      // Log success
      const duration = Date.now() - startTime;
      logRequest(request, requestId, 200, duration);

      // Return successful response
      return NextResponse.json(result);
    } catch (error) {
      const appError = toAppError(error);
      const duration = Date.now() - startTime;

      // Log error
      logRequest(request, requestId, appError.statusCode, duration, appError);

      // Return error response
      const errorResponse: ErrorResponse = createErrorResponse(appError);

      const response = NextResponse.json(errorResponse, {
        status: appError.statusCode,
      });

      // Add retry hint header if retryable
      if (appError.isRetryable) {
        response.headers.set("X-Retry-After", String(appError.metadata?.retryAfter || 5));
      }

      return response;
    }
  };
}

/**
 * Validate request body against a schema
 */
export function validateBody<T>(
  body: unknown,
  validator: (data: unknown) => { success: boolean; data?: T; error?: string }
): T {
  const result = validator(body);
  if (!result.success) {
    throw new ValidationError(result.error || "Invalid request body");
  }
  return result.data as T;
}

/**
 * Validate required fields in request body
 */
export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): void {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new ValidationError(`${String(field)} is required`, String(field));
    }
  }
}

/**
 * Log API request
 */
function logRequest(
  request: NextRequest,
  requestId: string,
  status: number,
  duration: number,
  error?: AppError
): void {
  const logData = {
    requestId,
    method: request.method,
    url: request.nextUrl.pathname,
    status,
    duration: `${duration}ms`,
    ...(error && {
      error: {
        code: error.code,
        message: error.message,
      },
    }),
  };

  if (error && error.statusCode >= 500) {
    console.error("[API Error]", JSON.stringify(logData));
  } else if (error) {
    console.warn("[API Warning]", JSON.stringify(logData));
  } else {
    // Only log in development or for slow requests
    if (process.env.NODE_ENV === "development" || duration > 1000) {
      console.log("[API]", JSON.stringify(logData));
    }
  }
}

/**
 * Helper to create a successful response with standard format
 */
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Helper to create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  }
) {
  return {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
      hasMore: pagination.page * pagination.pageSize < pagination.total,
    },
  };
}
