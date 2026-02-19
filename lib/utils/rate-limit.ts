// Simple in-memory rate limiter for API routes
// For production, consider using Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Maximum requests allowed in the time window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing (e.g., "api", "auth") */
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 * @returns Result with success status and remaining quota
 */
export function checkRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowSeconds, prefix = "default" } = options;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Clean up if window has expired
  if (entry && now >= entry.resetTime) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    // First request in window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowSeconds,
      limit,
    };
  }

  // Increment counter
  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > limit) {
    return {
      success: false,
      remaining: 0,
      resetIn,
      limit,
    };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    resetIn,
    limit,
  };
}

/**
 * Create rate limit headers for the response
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetIn.toString(),
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check common headers for proxied IPs
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the list (client's original IP)
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (Vercel specific)
  const vercelIP = request.headers.get("x-vercel-forwarded-for");
  if (vercelIP) {
    return vercelIP.split(",")[0].trim();
  }

  return "unknown";
}

// Predefined rate limit configurations
export const RateLimits = {
  // Standard API endpoints
  standard: { limit: 100, windowSeconds: 60, prefix: "api" },

  // Stricter limit for auth endpoints
  auth: { limit: 10, windowSeconds: 60, prefix: "auth" },

  // Very strict for password reset, OTP, etc.
  sensitive: { limit: 5, windowSeconds: 300, prefix: "sensitive" },

  // Upload endpoints
  upload: { limit: 20, windowSeconds: 60, prefix: "upload" },

  // Admin endpoints (per admin user)
  admin: { limit: 200, windowSeconds: 60, prefix: "admin" },

  // AI/Chat endpoints (expensive operations)
  ai: { limit: 30, windowSeconds: 60, prefix: "ai" },

  // Webinar chat messages (prevent spam during live)
  webinarChat: { limit: 10, windowSeconds: 30, prefix: "webinar-chat" },

  // Webinar Q&A submissions
  webinarQA: { limit: 5, windowSeconds: 60, prefix: "webinar-qa" },
} as const;

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      const entries = Array.from(rateLimitStore.entries());
      for (const [key, entry] of entries) {
        if (now >= entry.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}
