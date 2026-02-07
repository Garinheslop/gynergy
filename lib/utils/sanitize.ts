/**
 * Input Sanitization Utilities
 *
 * Functions to sanitize user input and prevent XSS, injection attacks.
 * Always sanitize user input before rendering or storing.
 */

/**
 * HTML entities that need escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for use in a URL parameter
 */
export function sanitizeUrlParam(str: string): string {
  if (typeof str !== "string") return "";
  return encodeURIComponent(str.trim());
}

/**
 * Sanitize a string for use as a filename
 * Removes or replaces characters that are invalid in filenames
 */
export function sanitizeFilename(str: string): string {
  if (typeof str !== "string") return "file";

  return (
    str
      // Replace path separators
      .replace(/[/\\]/g, "-")
      // Remove control characters and special chars
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"|?*\x00-\x1f]/g, "")
      // Replace multiple spaces/dashes with single dash
      .replace(/[\s-]+/g, "-")
      // Remove leading/trailing dashes and dots
      .replace(/^[-.\s]+|[-.\s]+$/g, "")
      // Limit length
      .slice(0, 200) || "file"
  );
}

/**
 * Sanitize email address
 * Returns empty string if invalid format
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";

  const trimmed = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return "";

  return trimmed;
}

/**
 * Sanitize phone number - keep only digits and common separators
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== "string") return "";

  // Keep only digits, plus, spaces, dashes, and parentheses
  return phone.replace(/[^\d+\s()-]/g, "").trim();
}

/**
 * Normalize phone to digits only (for storage/comparison)
 */
export function normalizePhone(phone: string): string {
  if (typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

/**
 * Sanitize text input - trim and limit length
 */
export function sanitizeText(
  str: string,
  options: {
    maxLength?: number;
    trim?: boolean;
    lowercase?: boolean;
    uppercase?: boolean;
  } = {}
): string {
  if (typeof str !== "string") return "";

  const { maxLength = 10000, trim = true, lowercase = false, uppercase = false } = options;

  let result = str;

  if (trim) {
    result = result.trim();
  }

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  if (lowercase) {
    result = result.toLowerCase();
  } else if (uppercase) {
    result = result.toUpperCase();
  }

  return result;
}

/**
 * Sanitize multiline text - normalize line endings
 */
export function sanitizeMultiline(str: string, maxLines?: number): string {
  if (typeof str !== "string") return "";

  // Normalize line endings to \n
  let result = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Limit number of lines if specified
  if (maxLines) {
    const lines = result.split("\n");
    if (lines.length > maxLines) {
      result = lines.slice(0, maxLines).join("\n");
    }
  }

  return result;
}

/**
 * Sanitize a URL - validate and return safe URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);

    // Only allow http, https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    // If it doesn't start with protocol, try adding https
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return sanitizeUrl(`https://${trimmed}`);
    }
    return "";
  }
}

/**
 * Sanitize JSON string - parse and re-stringify to ensure valid JSON
 */
export function sanitizeJson<T = unknown>(json: string): T | null {
  if (typeof json !== "string") return null;

  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Remove null bytes and other dangerous characters
 */
export function removeNullBytes(str: string): string {
  if (typeof str !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x00/g, "");
}

/**
 * Sanitize for SQL LIKE patterns (escape wildcards)
 */
export function sanitizeLikePattern(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[%_\\]/g, "\\$&");
}

/**
 * Sanitize a username
 * - Lowercase
 * - Only alphanumeric, underscore, dash
 * - Length limits
 */
export function sanitizeUsername(
  username: string,
  options: { minLength?: number; maxLength?: number } = {}
): string {
  if (typeof username !== "string") return "";

  const { minLength = 3, maxLength = 30 } = options;

  const sanitized = username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, maxLength);

  if (sanitized.length < minLength) return "";

  return sanitized;
}

/**
 * Sanitize a slug for URLs
 */
export function sanitizeSlug(str: string): string {
  if (typeof str !== "string") return "";

  return (
    str
      .toLowerCase()
      // Replace spaces and underscores with dashes
      .replace(/[\s_]+/g, "-")
      // Remove non-alphanumeric except dashes
      .replace(/[^a-z0-9-]/g, "")
      // Remove multiple consecutive dashes
      .replace(/-+/g, "-")
      // Remove leading/trailing dashes
      .replace(/^-|-$/g, "")
      .slice(0, 100)
  );
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: { maxStringLength?: number; escapeHtml?: boolean } = {}
): T {
  const { maxStringLength = 10000, escapeHtml: shouldEscape = false } = options;

  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      let result = sanitizeText(value, { maxLength: maxStringLength });
      if (shouldEscape) {
        result = escapeHtml(result);
      }
      return result;
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
      return sanitizeObject(value as Record<string, unknown>, options);
    }
    return value;
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(value);
  }

  return result as T;
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(str: string): boolean {
  if (typeof str !== "string") return false;

  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /data:/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(str));
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number, ellipsis = "..."): string {
  if (typeof str !== "string") return "";
  if (str.length <= maxLength) return str;

  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") return "";

  return (
    query
      .trim()
      // Remove special characters that could affect search
      .replace(/[<>{}[\]\\^~`|]/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .slice(0, 500)
  );
}
