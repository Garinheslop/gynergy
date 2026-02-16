/**
 * Analytics & Event Tracking Utility
 *
 * Provides a unified interface for tracking user events, page views,
 * and custom metrics across different analytics providers.
 */

/**
 * Event properties type
 */
export type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * User properties type
 */
export type UserProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
  name: string;
  properties?: EventProperties;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

/**
 * Page view event structure
 */
export interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
  properties?: EventProperties;
  timestamp: number;
}

/**
 * Analytics provider interface
 */
export interface AnalyticsProvider {
  name: string;
  track: (event: AnalyticsEvent) => void | Promise<void>;
  page: (pageView: PageViewEvent) => void | Promise<void>;
  identify: (userId: string, properties?: UserProperties) => void | Promise<void>;
  reset: () => void | Promise<void>;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  debug?: boolean;
  disabled?: boolean;
  providers?: AnalyticsProvider[];
  batchSize?: number;
  flushInterval?: number;
  sessionTimeout?: number;
}

/**
 * Event queue item
 */
interface QueuedEvent {
  type: "track" | "page" | "identify";
  data: AnalyticsEvent | PageViewEvent | { userId: string; properties?: UserProperties };
}

/**
 * Analytics singleton class
 */
class Analytics {
  private config: Required<AnalyticsConfig>;
  private providers: AnalyticsProvider[] = [];
  private eventQueue: QueuedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private sessionStartTime: number;
  private lastActivityTime: number;
  private isInitialized = false;

  constructor() {
    this.config = {
      debug: false,
      disabled: false,
      providers: [],
      batchSize: 10,
      flushInterval: 5000,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
    };
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
  }

  /**
   * Initialize analytics with configuration
   */
  init(config: AnalyticsConfig = {}): void {
    this.config = {
      ...this.config,
      ...config,
      providers: config.providers || this.config.providers,
    };

    if (config.providers) {
      this.providers = config.providers;
    }

    // Start flush timer
    if (!this.config.disabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }

    // Add visibility change listener for session management
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
      window.addEventListener("pagehide", () => this.flush());
    }

    this.isInitialized = true;
    this.log("Analytics initialized");
  }

  /**
   * Add an analytics provider
   */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
    this.log(`Provider added: ${provider.name}`);
  }

  /**
   * Remove a provider by name
   */
  removeProvider(name: string): void {
    this.providers = this.providers.filter((p) => p.name !== name);
    this.log(`Provider removed: ${name}`);
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: EventProperties): void {
    if (this.config.disabled) return;

    this.updateSession();

    const event: AnalyticsEvent = {
      name: eventName,
      properties: this.enrichProperties(properties),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
    };

    this.queueEvent({ type: "track", data: event });
    this.log(`Track: ${eventName}`, properties);
  }

  /**
   * Track a page view
   */
  page(path?: string, title?: string, properties?: EventProperties): void {
    if (this.config.disabled) return;

    this.updateSession();

    const pageView: PageViewEvent = {
      path: path || (typeof window !== "undefined" ? window.location.pathname : ""),
      title: title || (typeof document !== "undefined" ? document.title : ""),
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      properties: this.enrichProperties(properties),
      timestamp: Date.now(),
    };

    this.queueEvent({ type: "page", data: pageView });
    this.log(`Page: ${pageView.path}`);
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties): void {
    if (this.config.disabled) return;

    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };

    this.queueEvent({
      type: "identify",
      data: { userId, properties: this.userProperties },
    });
    this.log(`Identify: ${userId}`, properties);
  }

  /**
   * Set user properties without changing userId
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  /**
   * Reset analytics (on logout)
   */
  reset(): void {
    this.flush();
    this.userId = null;
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    for (const provider of this.providers) {
      try {
        provider.reset();
      } catch (error) {
        this.log(`Error resetting provider ${provider.name}:`, error);
      }
    }

    this.log("Analytics reset");
  }

  /**
   * Flush all queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const queuedEvent of events) {
      await this.sendToProviders(queuedEvent);
    }
  }

  /**
   * Get current session info
   */
  getSession(): { id: string; startTime: number; duration: number } {
    return {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime,
    };
  }

  /**
   * Get current user info
   */
  getUser(): { id: string | null; properties: UserProperties } {
    return {
      id: this.userId,
      properties: { ...this.userProperties },
    };
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.disabled = !enabled;
    if (enabled && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return !this.config.disabled;
  }

  // Private methods

  private queueEvent(event: QueuedEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private async sendToProviders(queuedEvent: QueuedEvent): Promise<void> {
    for (const provider of this.providers) {
      try {
        switch (queuedEvent.type) {
          case "track":
            await provider.track(queuedEvent.data as AnalyticsEvent);
            break;
          case "page":
            await provider.page(queuedEvent.data as PageViewEvent);
            break;
          case "identify": {
            const identifyData = queuedEvent.data as {
              userId: string;
              properties?: UserProperties;
            };
            await provider.identify(identifyData.userId, identifyData.properties);
            break;
          }
        }
      } catch (error) {
        this.log(`Error sending to provider ${provider.name}:`, error);
      }
    }
  }

  private enrichProperties(properties?: EventProperties): EventProperties {
    return {
      ...properties,
      session_id: this.sessionId,
      session_duration: Date.now() - this.sessionStartTime,
      ...(typeof window !== "undefined" && {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        user_agent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    };
  }

  private updateSession(): void {
    const now = Date.now();

    // Check for session timeout
    if (now - this.lastActivityTime > this.config.sessionTimeout) {
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = now;
      this.log("New session started (timeout)");
    }

    this.lastActivityTime = now;
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.flush();
    }
  };

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[Analytics] ${message}`, data !== undefined ? data : "");
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience exports
export const track = (name: string, properties?: EventProperties) =>
  analytics.track(name, properties);
export const page = (path?: string, title?: string, properties?: EventProperties) =>
  analytics.page(path, title, properties);
export const identify = (userId: string, properties?: UserProperties) =>
  analytics.identify(userId, properties);

/**
 * Pre-built analytics providers
 */

/**
 * Console provider (for development)
 */
export const consoleProvider: AnalyticsProvider = {
  name: "console",
  track: (event) => {
    // eslint-disable-next-line no-console
    console.log("[Analytics:Track]", event.name, event.properties);
  },
  page: (pageView) => {
    // eslint-disable-next-line no-console
    console.log("[Analytics:Page]", pageView.path, pageView.properties);
  },
  identify: (userId, properties) => {
    // eslint-disable-next-line no-console
    console.log("[Analytics:Identify]", userId, properties);
  },
  reset: () => {
    // eslint-disable-next-line no-console
    console.log("[Analytics:Reset]");
  },
};

/**
 * Local storage provider (for debugging/offline)
 */
export function createLocalStorageProvider(key = "analytics_events"): AnalyticsProvider {
  const getEvents = (): unknown[] => {
    if (typeof localStorage === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const saveEvent = (event: unknown): void => {
    if (typeof localStorage === "undefined") return;
    const events = getEvents();
    events.push(event);
    // Keep last 1000 events
    const trimmed = events.slice(-1000);
    localStorage.setItem(key, JSON.stringify(trimmed));
  };

  return {
    name: "localStorage",
    track: (event) => saveEvent({ type: "track", ...event }),
    page: (pageView) => saveEvent({ type: "page", ...pageView }),
    identify: (userId, properties) => saveEvent({ type: "identify", userId, properties }),
    reset: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    },
  };
}

/**
 * Beacon provider (for reliable delivery on page unload)
 */
export function createBeaconProvider(endpoint: string): AnalyticsProvider {
  const send = (data: unknown): void => {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
    navigator.sendBeacon(endpoint, JSON.stringify(data));
  };

  return {
    name: "beacon",
    track: (event) => send({ type: "track", ...event }),
    page: (pageView) => send({ type: "page", ...pageView }),
    identify: (userId, properties) => send({ type: "identify", userId, properties }),
    reset: () => {},
  };
}

/**
 * Custom fetch provider
 */
export function createFetchProvider(
  endpoint: string,
  options: {
    headers?: Record<string, string>;
    method?: "POST" | "PUT";
    transformPayload?: (data: unknown) => unknown;
  } = {}
): AnalyticsProvider {
  const { headers = {}, method = "POST", transformPayload = (d) => d } = options;

  const send = async (data: unknown): Promise<void> => {
    try {
      await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(transformPayload(data)),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Analytics:Fetch] Error:", error);
    }
  };

  return {
    name: "fetch",
    track: (event) => send({ type: "track", ...event }),
    page: (pageView) => send({ type: "page", ...pageView }),
    identify: (userId, properties) => send({ type: "identify", userId, properties }),
    reset: () => {},
  };
}

/**
 * Standard event names for consistency
 */
export const EventNames = {
  // Authentication
  SIGN_UP: "sign_up",
  LOGIN: "login",
  LOGOUT: "logout",
  PASSWORD_RESET: "password_reset",

  // Navigation
  PAGE_VIEW: "page_view",
  TAB_SWITCH: "tab_switch",
  MODAL_OPEN: "modal_open",
  MODAL_CLOSE: "modal_close",

  // Content
  CONTENT_VIEW: "content_view",
  VIDEO_START: "video_start",
  VIDEO_COMPLETE: "video_complete",
  VIDEO_PROGRESS: "video_progress",
  ARTICLE_READ: "article_read",

  // Engagement
  LIKE: "like",
  COMMENT: "comment",
  SHARE: "share",
  BOOKMARK: "bookmark",
  FOLLOW: "follow",

  // Transactions
  PURCHASE_START: "purchase_start",
  PURCHASE_COMPLETE: "purchase_complete",
  PURCHASE_FAILED: "purchase_failed",
  SUBSCRIPTION_START: "subscription_start",
  SUBSCRIPTION_CANCEL: "subscription_cancel",

  // Features
  FEATURE_USED: "feature_used",
  SEARCH: "search",
  FILTER_APPLIED: "filter_applied",
  EXPORT: "export",
  DOWNLOAD: "download",

  // Errors
  ERROR: "error",
  VALIDATION_ERROR: "validation_error",
  API_ERROR: "api_error",

  // Performance
  SLOW_LOAD: "slow_load",
  LONG_TASK: "long_task",

  // AI
  AI_CHAT_START: "ai_chat_start",
  AI_CHAT_MESSAGE: "ai_chat_message",
  AI_SUGGESTION_ACCEPTED: "ai_suggestion_accepted",
  AI_SUGGESTION_REJECTED: "ai_suggestion_rejected",

  // Gamification
  BADGE_EARNED: "badge_earned",
  LEVEL_UP: "level_up",
  STREAK_UPDATED: "streak_updated",
  CHALLENGE_STARTED: "challenge_started",
  CHALLENGE_COMPLETED: "challenge_completed",

  // Assessment Funnel
  ASSESSMENT_VIEWED: "assessment_viewed",
  ASSESSMENT_STARTED: "assessment_started",
  ASSESSMENT_RESUMED: "assessment_resumed",
  ASSESSMENT_QUESTION_ANSWERED: "assessment_question_answered",
  ASSESSMENT_SECTION_COMPLETED: "assessment_section_completed",
  ASSESSMENT_QUESTIONS_COMPLETED: "assessment_questions_completed",
  ASSESSMENT_EMAIL_SUBMITTED: "assessment_email_submitted",
  ASSESSMENT_EMAIL_FAILED: "assessment_email_failed",
  ASSESSMENT_COMPLETED: "assessment_completed",
  ASSESSMENT_ABANDONED: "assessment_abandoned",
  ASSESSMENT_CTA_CLICKED: "assessment_cta_clicked",
} as const;

/**
 * Track function with typed event names
 */
export function trackEvent<K extends keyof typeof EventNames>(
  eventKey: K,
  properties?: EventProperties
): void {
  analytics.track(EventNames[eventKey], properties);
}
