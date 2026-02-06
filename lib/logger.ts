/**
 * Structured Logger for Gynergy Application
 *
 * Provides consistent, structured logging with levels and context.
 * In production, logs are JSON formatted for easy parsing.
 * In development, logs are human-readable.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
const isProduction = process.env.NODE_ENV === "production";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }

  const { level, message, timestamp, module, ...rest } = entry;
  const prefix = module ? `[${module}]` : "";
  const contextStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";

  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${prefix} ${message}${contextStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  module?: string
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    module,
    ...context,
  };
}

function log(level: LogLevel, message: string, context?: LogContext, module?: string): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context, module);
  const formatted = formatLog(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      // Use console.info for info/debug to avoid being stripped in some environments
      console.info(formatted);
  }
}

/**
 * Create a logger instance with a specific module name
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: LogContext) => log("debug", message, context, module),
    info: (message: string, context?: LogContext) => log("info", message, context, module),
    warn: (message: string, context?: LogContext) => log("warn", message, context, module),
    error: (message: string, context?: LogContext) => log("error", message, context, module),
  };
}

/**
 * Default logger instance
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

// Pre-configured module loggers
export const apiLogger = createLogger("api");
export const authLogger = createLogger("auth");
export const paymentLogger = createLogger("payment");
export const aiLogger = createLogger("ai");
