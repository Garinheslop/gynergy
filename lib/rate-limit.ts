/**
 * Rate Limiting Utility for API Routes
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to in-memory limiting when Redis is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development/testing
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Create Redis client if configured
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
    analytics: true,
    prefix: "gynergy-ratelimit",
  });
}

/**
 * In-memory rate limiter for development/fallback
 */
function inMemoryRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const record = inMemoryStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    const entries = Array.from(inMemoryStore.entries());
    for (const [key, value] of entries) {
      if (value.resetTime < now) {
        inMemoryStore.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    inMemoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

/**
 * Check rate limit for an identifier (usually IP address or user ID)
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Use Upstash if configured
  if (ratelimit) {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fall back to in-memory rate limiting
  return inMemoryRateLimit(identifier);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Create a stricter rate limiter for sensitive endpoints (auth, payments)
 */
export async function checkStrictRateLimit(identifier: string): Promise<RateLimitResult> {
  if (ratelimit && redis) {
    const strictLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
      prefix: "gynergy-strict-ratelimit",
    });
    const result = await strictLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fall back to stricter in-memory limiting
  return inMemoryRateLimit(identifier, 10, 60000);
}
