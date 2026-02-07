/**
 * Retry Utility with Exponential Backoff
 *
 * Provides resilient retry logic for network requests and async operations.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffFactor?: number;
  /** Add randomness to delay to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Default function to determine if an error is retryable
 */
function defaultIsRetryable(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }

  // Check for HTTP status codes
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429 || status === 408;
  }

  // Check for common error messages
  if (error instanceof Error) {
    const retryableMessages = [
      "network",
      "timeout",
      "ECONNRESET",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNREFUSED",
    ];
    return retryableMessages.some((msg) => error.message.toLowerCase().includes(msg.toLowerCase()));
  }

  return false;
}

/**
 * Calculate delay with optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitter: boolean
): number {
  // Exponential backoff
  let delay = initialDelay * Math.pow(backoffFactor, attempt - 1);

  // Add jitter (±25%)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5;
    delay *= jitterFactor;
  }

  // Cap at max delay
  return Math.min(delay, maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new Error("Retry aborted"));
      });
    }
  });
}

/**
 * Execute an async operation with retry logic
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
 * );
 *
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
    isRetryable = defaultIsRetryable,
    onRetry,
    signal,
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check if aborted
      if (signal?.aborted) {
        throw new Error("Retry aborted");
      }

      const data = await operation();
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt >= maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!isRetryable(error)) {
        break;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor, jitter);

      // Notify about retry
      onRetry?.(attempt, error, delay);

      // Wait before retrying
      await sleep(delay, signal);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Retry with a simple boolean result
 */
export async function retryWithFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retry(operation, options);
  return result.success ? (result.data as T) : fallback;
}

/**
 * Create a retryable fetch function
 */
export function createRetryFetch(defaultOptions: RetryOptions = {}) {
  return async function retryFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const result = await retry(
      async () => {
        const response = await fetch(input, init);

        // Throw on server errors to trigger retry
        if (response.status >= 500 || response.status === 429) {
          const error = new Error(`HTTP ${response.status}`);
          (error as Error & { status: number }).status = response.status;
          throw error;
        }

        return response;
      },
      {
        ...defaultOptions,
        isRetryable: (error) => {
          if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status: number }).status;
            return status >= 500 || status === 429;
          }
          return defaultIsRetryable(error);
        },
      }
    );

    if (!result.success) {
      throw result.error;
    }

    return result.data as Response;
  };
}

/**
 * Circuit breaker pattern to prevent repeated failures
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting to close circuit (default: 60000) */
  resetTimeout?: number;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
}

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker<T> {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(
    private readonly operation: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000,
      onOpen: options.onOpen ?? (() => {}),
      onClose: options.onClose ?? (() => {}),
    };
  }

  async execute(): Promise<T> {
    if (this.state === "open") {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await this.operation();

      // Success - reset on closed or half-open
      if (this.state === "half-open") {
        this.close();
      }
      this.failures = 0;

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = "open";
    this.options.onOpen();
  }

  private close(): void {
    this.state = "closed";
    this.failures = 0;
    this.options.onClose();
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.close();
  }
}

/**
 * Retry decorator for class methods
 */
export function withRetry(options: RetryOptions = {}) {
  return function <T>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ): TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>> {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const result = await retry(() => originalMethod?.apply(this, args) as Promise<T>, options);

      if (!result.success) {
        throw result.error;
      }

      return result.data as T;
    };

    return descriptor;
  };
}
