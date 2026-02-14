// Standardized Error Types for Gynergy Platform
// Provides consistent error handling across API routes and client code

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "EXTERNAL_SERVICE_ERROR";

export interface ErrorMetadata {
  field?: string;
  limit?: number;
  retryAfter?: number;
  service?: string;
  [key: string]: unknown;
}

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly metadata?: ErrorMetadata;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    options: {
      isRetryable?: boolean;
      metadata?: ErrorMetadata;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = options.isRetryable ?? false;
    this.metadata = options.metadata;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super("VALIDATION_ERROR", message, 400, {
      metadata: field ? { field } : undefined,
    });
    this.name = "ValidationError";
  }
}

/**
 * Authentication errors (401)
 */
export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super("AUTH_ERROR", message, 401);
    this.name = "AuthError";
  }
}

/**
 * Authorization/Forbidden errors (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("RATE_LIMITED", "Too many requests. Please try again later.", 429, {
      isRetryable: true,
      metadata: retryAfter ? { retryAfter } : undefined,
    });
    this.name = "RateLimitError";
  }
}

/**
 * Network/connectivity errors
 */
export class NetworkError extends AppError {
  constructor(message = "Network error. Please check your connection.") {
    super("NETWORK_ERROR", message, 0, { isRetryable: true });
    this.name = "NetworkError";
  }
}

/**
 * External service errors (third-party API failures)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super("EXTERNAL_SERVICE_ERROR", message || `Error communicating with ${service}`, 502, {
      isRetryable: true,
      metadata: { service },
    });
    this.name = "ExternalServiceError";
  }
}

/**
 * Payment-specific errors
 */
export class PaymentError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super("PAYMENT_ERROR", message, 402, { metadata });
    this.name = "PaymentError";
  }
}

/**
 * Generic server error (500)
 */
export class ServerError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super("SERVER_ERROR", message, 500, { isRetryable: true });
    this.name = "ServerError";
  }
}

/**
 * Check if an error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ServerError(error.message);
  }

  return new ServerError(String(error));
}

/**
 * Error response format for API routes
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    isRetryable: boolean;
    metadata?: ErrorMetadata;
    timestamp: string;
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      isRetryable: error.isRetryable,
      metadata: error.metadata,
      timestamp: error.timestamp,
    },
  };
}
