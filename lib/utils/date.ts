/**
 * Date/Time Formatting Utilities
 *
 * Comprehensive date manipulation and formatting without external dependencies.
 * Uses native Intl APIs for localization.
 */

/**
 * Format options for dates
 */
export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
}

/**
 * Format a date to a readable string
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions & {
    format?: "short" | "medium" | "long" | "full";
  } = {}
): string {
  const { format = "medium", locale = "en-US", timeZone } = options;
  const d = toDate(date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
  };

  switch (format) {
    case "short":
      formatOptions.month = "numeric";
      formatOptions.day = "numeric";
      formatOptions.year = "2-digit";
      break;
    case "medium":
      formatOptions.month = "short";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
    case "long":
      formatOptions.month = "long";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
    case "full":
      formatOptions.weekday = "long";
      formatOptions.month = "long";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(d);
}

/**
 * Format a time to a readable string
 */
export function formatTime(
  date: Date | string | number,
  options: DateFormatOptions & {
    format?: "short" | "medium" | "long";
    hour12?: boolean;
  } = {}
): string {
  const { format = "short", locale = "en-US", timeZone, hour12 = true } = options;
  const d = toDate(date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hour12,
  };

  switch (format) {
    case "short":
      formatOptions.hour = "numeric";
      formatOptions.minute = "2-digit";
      break;
    case "medium":
      formatOptions.hour = "numeric";
      formatOptions.minute = "2-digit";
      formatOptions.second = "2-digit";
      break;
    case "long":
      formatOptions.hour = "numeric";
      formatOptions.minute = "2-digit";
      formatOptions.second = "2-digit";
      formatOptions.timeZoneName = "short";
      break;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(d);
}

/**
 * Format a date and time together
 */
export function formatDateTime(
  date: Date | string | number,
  options: DateFormatOptions & {
    dateFormat?: "short" | "medium" | "long" | "full";
    timeFormat?: "short" | "medium" | "long";
    hour12?: boolean;
  } = {}
): string {
  const {
    dateFormat = "medium",
    timeFormat = "short",
    locale = "en-US",
    timeZone,
    hour12 = true,
  } = options;
  const d = toDate(date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hour12,
    hour: "numeric",
    minute: "2-digit",
  };

  // Date parts
  switch (dateFormat) {
    case "short":
      formatOptions.month = "numeric";
      formatOptions.day = "numeric";
      formatOptions.year = "2-digit";
      break;
    case "medium":
      formatOptions.month = "short";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
    case "long":
      formatOptions.month = "long";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
    case "full":
      formatOptions.weekday = "long";
      formatOptions.month = "long";
      formatOptions.day = "numeric";
      formatOptions.year = "numeric";
      break;
  }

  // Time parts
  if (timeFormat === "medium" || timeFormat === "long") {
    formatOptions.second = "2-digit";
  }
  if (timeFormat === "long") {
    formatOptions.timeZoneName = "short";
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(d);
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(
  date: Date | string | number,
  options: DateFormatOptions & {
    baseDate?: Date;
    style?: "long" | "short" | "narrow";
  } = {}
): string {
  const { locale = "en-US", baseDate = new Date(), style = "long" } = options;
  const d = toDate(date);
  const base = toDate(baseDate);

  const diffMs = d.getTime() - base.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  } else if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, "day");
  } else if (Math.abs(diffWeek) < 4) {
    return rtf.format(diffWeek, "week");
  } else if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  } else {
    return rtf.format(diffYear, "year");
  }
}

/**
 * Format a duration in milliseconds to human-readable string
 */
export function formatDuration(
  ms: number,
  options: {
    format?: "short" | "long" | "digital";
    maxUnits?: number;
    showZero?: boolean;
  } = {}
): string {
  const { format = "short", maxUnits = 2, showZero = false } = options;

  const absMs = Math.abs(ms);
  const seconds = Math.floor(absMs / 1000) % 60;
  const minutes = Math.floor(absMs / (1000 * 60)) % 60;
  const hours = Math.floor(absMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));

  if (format === "digital") {
    if (days > 0) {
      return `${days}:${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    } else if (hours > 0) {
      return `${hours}:${padZero(minutes)}:${padZero(seconds)}`;
    } else {
      return `${minutes}:${padZero(seconds)}`;
    }
  }

  const units: Array<{ value: number; short: string; long: string }> = [
    { value: days, short: "d", long: days === 1 ? "day" : "days" },
    { value: hours, short: "h", long: hours === 1 ? "hour" : "hours" },
    { value: minutes, short: "m", long: minutes === 1 ? "minute" : "minutes" },
    { value: seconds, short: "s", long: seconds === 1 ? "second" : "seconds" },
  ];

  const parts: string[] = [];
  for (const unit of units) {
    if (parts.length >= maxUnits) break;
    if (unit.value > 0 || (showZero && parts.length > 0)) {
      if (format === "short") {
        parts.push(`${unit.value}${unit.short}`);
      } else {
        parts.push(`${unit.value} ${unit.long}`);
      }
    }
  }

  if (parts.length === 0) {
    return format === "short" ? "0s" : "0 seconds";
  }

  return parts.join(format === "short" ? " " : ", ");
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = toDate(date);
  const today = new Date();
  return isSameDay(d, today);
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = toDate(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d, yesterday);
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date | string | number): boolean {
  const d = toDate(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if two dates are the same month
 */
export function isSameMonth(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * Check if two dates are the same year
 */
export function isSameYear(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  return d1.getFullYear() === d2.getFullYear();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return toDate(date).getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return toDate(date).getTime() > Date.now();
}

/**
 * Check if a date is within a range
 */
export function isWithinRange(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const d = toDate(date).getTime();
  return d >= toDate(start).getTime() && d <= toDate(end).getTime();
}

/**
 * Get the start of a day (midnight)
 */
export function startOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a day (23:59:59.999)
 */
export function endOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of a week (Sunday by default)
 */
export function startOfWeek(
  date: Date | string | number,
  options: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = {}
): Date {
  const { weekStartsOn = 0 } = options;
  const d = toDate(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a week (Saturday by default)
 */
export function endOfWeek(
  date: Date | string | number,
  options: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = {}
): Date {
  const d = startOfWeek(date, options);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of a month
 */
export function startOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a month
 */
export function endOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of a year
 */
export function startOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a year
 */
export function endOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add time to a date
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
): Date {
  const d = toDate(date);

  switch (unit) {
    case "seconds":
      d.setSeconds(d.getSeconds() + amount);
      break;
    case "minutes":
      d.setMinutes(d.getMinutes() + amount);
      break;
    case "hours":
      d.setHours(d.getHours() + amount);
      break;
    case "days":
      d.setDate(d.getDate() + amount);
      break;
    case "weeks":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "months":
      d.setMonth(d.getMonth() + amount);
      break;
    case "years":
      d.setFullYear(d.getFullYear() + amount);
      break;
  }

  return d;
}

/**
 * Subtract time from a date
 */
export function subtractTime(
  date: Date | string | number,
  amount: number,
  unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
): Date {
  return addTime(date, -amount, unit);
}

/**
 * Get the difference between two dates
 */
export function diffTime(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
): number {
  const d1 = toDate(date1).getTime();
  const d2 = toDate(date2).getTime();
  const diffMs = d1 - d2;

  switch (unit) {
    case "seconds":
      return Math.floor(diffMs / 1000);
    case "minutes":
      return Math.floor(diffMs / (1000 * 60));
    case "hours":
      return Math.floor(diffMs / (1000 * 60 * 60));
    case "days":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case "weeks":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case "months":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    case "years":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    default:
      return diffMs;
  }
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(date: Date | string | number): number {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Get the day of year (1-366)
 */
export function getDayOfYear(date: Date | string | number): number {
  const d = toDate(date);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get the week number (ISO 8601)
 */
export function getWeekNumber(date: Date | string | number): number {
  const d = toDate(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get calendar dates for a month (for building calendars)
 */
export function getCalendarDates(
  date: Date | string | number,
  options: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = {}
): Date[] {
  const { weekStartsOn = 0 } = options;
  const d = toDate(date);
  const firstDay = startOfMonth(d);
  const lastDay = endOfMonth(d);

  const dates: Date[] = [];

  // Add days from previous month to fill first week
  const firstDayOfWeek = firstDay.getDay();
  const daysFromPrevMonth = (firstDayOfWeek - weekStartsOn + 7) % 7;
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const prevDate = new Date(firstDay);
    prevDate.setDate(firstDay.getDate() - i - 1);
    dates.push(prevDate);
  }

  // Add all days of the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(d.getFullYear(), d.getMonth(), i));
  }

  // Add days from next month to complete last week
  const remainingDays = (7 - (dates.length % 7)) % 7;
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(lastDay);
    nextDate.setDate(lastDay.getDate() + i);
    dates.push(nextDate);
  }

  return dates;
}

/**
 * Format a date to ISO 8601 string (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string | number): string {
  const d = toDate(date);
  return d.toISOString().split("T")[0];
}

/**
 * Parse a date string safely
 */
export function parseDate(dateString: string): Date | null {
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Convert various input types to Date
 */
export function toDate(input: Date | string | number): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }
  if (typeof input === "number") {
    return new Date(input);
  }
  return new Date(input);
}

/**
 * Format a date as a compact time-ago string for feeds/comments.
 * Use compact=true for short labels without "ago" (e.g. "3m", "5h").
 * Default returns "3m ago", "5h ago", etc.
 */
export function formatTimeAgo(
  date: Date | string | number,
  options: { compact?: boolean } = {}
): string {
  const d = toDate(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const suffix = options.compact ? "" : " ago";

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m${suffix}`;
  if (hours < 24) return `${hours}h${suffix}`;
  if (days < 7) return `${days}d${suffix}`;
  return d.toLocaleDateString();
}

/**
 * Helper to pad single digits with zero
 */
function padZero(num: number): string {
  return num.toString().padStart(2, "0");
}

/**
 * Get list of timezone names
 */
export function getTimezones(): string[] {
  return Intl.supportedValuesOf("timeZone");
}

/**
 * Get the user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date to a different timezone
 */
export function toTimezone(
  date: Date | string | number,
  timeZone: string,
  locale: string = "en-US"
): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Get a human-readable timezone offset string
 */
export function getTimezoneOffset(timeZone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  });
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find((part) => part.type === "timeZoneName");
  return offsetPart?.value || "";
}
