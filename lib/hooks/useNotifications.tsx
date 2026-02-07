"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * Notification/Toast System
 *
 * Flexible notification system with stacking, auto-dismiss,
 * and customizable positions.
 */

/**
 * Notification types
 */
export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

/**
 * Notification position
 */
export type NotificationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Notification data
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  createdAt: number;
  progress?: number;
  icon?: ReactNode;
}

/**
 * Notification options
 */
export interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  icon?: ReactNode;
}

/**
 * Notification context value
 */
export interface NotificationContextValue {
  notifications: Notification[];
  show: (message: string, options?: NotificationOptions) => string;
  success: (message: string, options?: Omit<NotificationOptions, "type">) => string;
  error: (message: string, options?: Omit<NotificationOptions, "type">) => string;
  warning: (message: string, options?: Omit<NotificationOptions, "type">) => string;
  info: (message: string, options?: Omit<NotificationOptions, "type">) => string;
  loading: (message: string, options?: Omit<NotificationOptions, "type">) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    },
    options?: Omit<NotificationOptions, "type">
  ) => Promise<T>;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, updates: Partial<Omit<Notification, "id" | "createdAt">>) => void;
}

/**
 * Default notification durations by type
 */
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0, // No auto-dismiss for loading
};

/**
 * Generate unique ID
 */
function generateId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Notification manager class
 */
class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private maxNotifications: number = 5;

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const notificationArray = Array.from(this.notifications.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
    this.listeners.forEach((listener) => listener(notificationArray));
  }

  show(message: string, options: NotificationOptions = {}): string {
    const id = generateId();
    const type = options.type || "info";

    const notification: Notification = {
      id,
      type,
      message,
      title: options.title,
      duration: options.duration ?? DEFAULT_DURATIONS[type],
      dismissible: options.dismissible ?? true,
      action: options.action,
      onDismiss: options.onDismiss,
      createdAt: Date.now(),
      icon: options.icon,
    };

    // Limit max notifications
    if (this.notifications.size >= this.maxNotifications) {
      const oldest = Array.from(this.notifications.values()).sort(
        (a, b) => a.createdAt - b.createdAt
      )[0];
      if (oldest) {
        this.dismiss(oldest.id);
      }
    }

    this.notifications.set(id, notification);

    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
      this.timers.set(id, timer);
    }

    this.notify();
    return id;
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.onDismiss?.();
      this.notifications.delete(id);

      // Clear timer
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(id);
      }

      this.notify();
    }
  }

  dismissAll(): void {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Call onDismiss for all
    this.notifications.forEach((notification) => {
      notification.onDismiss?.();
    });

    this.notifications.clear();
    this.notify();
  }

  update(id: string, updates: Partial<Omit<Notification, "id" | "createdAt">>): void {
    const notification = this.notifications.get(id);
    if (notification) {
      Object.assign(notification, updates);

      // Update timer if duration changed
      if (updates.duration !== undefined) {
        const existingTimer = this.timers.get(id);
        if (existingTimer) {
          clearTimeout(existingTimer);
          this.timers.delete(id);
        }

        if (updates.duration > 0) {
          const timer = setTimeout(() => {
            this.dismiss(id);
          }, updates.duration);
          this.timers.set(id, timer);
        }
      }

      this.notify();
    }
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  setMaxNotifications(max: number): void {
    this.maxNotifications = max;
  }
}

// Global manager instance
const manager = new NotificationManager();

/**
 * Notification context
 */
const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Notification provider props
 */
export interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

/**
 * Notification provider component
 */
export function NotificationProvider({
  children,
  maxNotifications = 5,
}: NotificationProviderProps): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    manager.setMaxNotifications(maxNotifications);
    return manager.subscribe(setNotifications);
  }, [maxNotifications]);

  const show = useCallback((message: string, options?: NotificationOptions) => {
    return manager.show(message, options);
  }, []);

  const success = useCallback((message: string, options?: Omit<NotificationOptions, "type">) => {
    return manager.show(message, { ...options, type: "success" });
  }, []);

  const error = useCallback((message: string, options?: Omit<NotificationOptions, "type">) => {
    return manager.show(message, { ...options, type: "error" });
  }, []);

  const warning = useCallback((message: string, options?: Omit<NotificationOptions, "type">) => {
    return manager.show(message, { ...options, type: "warning" });
  }, []);

  const info = useCallback((message: string, options?: Omit<NotificationOptions, "type">) => {
    return manager.show(message, { ...options, type: "info" });
  }, []);

  const loading = useCallback((message: string, options?: Omit<NotificationOptions, "type">) => {
    return manager.show(message, { ...options, type: "loading", dismissible: false });
  }, []);

  const promise = useCallback(
    async <T,>(
      promiseValue: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      },
      options?: Omit<NotificationOptions, "type">
    ): Promise<T> => {
      const id = manager.show(messages.loading, {
        ...options,
        type: "loading",
        dismissible: false,
      });

      try {
        const result = await promiseValue;
        const successMessage =
          typeof messages.success === "function" ? messages.success(result) : messages.success;

        manager.update(id, {
          type: "success",
          message: successMessage,
          dismissible: true,
          duration: DEFAULT_DURATIONS.success,
        });

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        const errorMessage =
          typeof messages.error === "function" ? messages.error(errorObj) : messages.error;

        manager.update(id, {
          type: "error",
          message: errorMessage,
          dismissible: true,
          duration: DEFAULT_DURATIONS.error,
        });

        throw err;
      }
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    manager.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    manager.dismissAll();
  }, []);

  const update = useCallback(
    (id: string, updates: Partial<Omit<Notification, "id" | "createdAt">>) => {
      manager.update(id, updates);
    },
    []
  );

  const value: NotificationContextValue = {
    notifications,
    show,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    dismissAll,
    update,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Use notifications hook
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    // Return a standalone manager if no provider
    return {
      notifications: manager.getAll(),
      show: (message, options) => manager.show(message, options),
      success: (message, options) => manager.show(message, { ...options, type: "success" }),
      error: (message, options) => manager.show(message, { ...options, type: "error" }),
      warning: (message, options) => manager.show(message, { ...options, type: "warning" }),
      info: (message, options) => manager.show(message, { ...options, type: "info" }),
      loading: (message, options) =>
        manager.show(message, { ...options, type: "loading", dismissible: false }),
      promise: async (promiseValue, messages, options) => {
        const id = manager.show(messages.loading, {
          ...options,
          type: "loading",
          dismissible: false,
        });
        try {
          const result = await promiseValue;
          const msg =
            typeof messages.success === "function" ? messages.success(result) : messages.success;
          manager.update(id, { type: "success", message: msg, dismissible: true });
          return result;
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          const msg =
            typeof messages.error === "function" ? messages.error(errorObj) : messages.error;
          manager.update(id, { type: "error", message: msg, dismissible: true });
          throw err;
        }
      },
      dismiss: (id) => manager.dismiss(id),
      dismissAll: () => manager.dismissAll(),
      update: (id, updates) => manager.update(id, updates),
    };
  }

  return context;
}

/**
 * Standalone toast functions (for use without context)
 */
/**
 * Toast promise helper function
 */
async function toastPromise<T>(
  promiseValue: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  },
  options?: Omit<NotificationOptions, "type">
): Promise<T> {
  const id = manager.show(messages.loading, {
    ...options,
    type: "loading",
    dismissible: false,
  });
  try {
    const result = await promiseValue;
    const msg =
      typeof messages.success === "function" ? messages.success(result) : messages.success;
    manager.update(id, {
      type: "success",
      message: msg,
      dismissible: true,
      duration: DEFAULT_DURATIONS.success,
    });
    return result;
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    const msg = typeof messages.error === "function" ? messages.error(errorObj) : messages.error;
    manager.update(id, {
      type: "error",
      message: msg,
      dismissible: true,
      duration: DEFAULT_DURATIONS.error,
    });
    throw err;
  }
}

/**
 * Standalone toast functions (for use without context)
 */
export const toast = {
  show: (message: string, options?: NotificationOptions) => manager.show(message, options),
  success: (message: string, options?: Omit<NotificationOptions, "type">) =>
    manager.show(message, { ...options, type: "success" }),
  error: (message: string, options?: Omit<NotificationOptions, "type">) =>
    manager.show(message, { ...options, type: "error" }),
  warning: (message: string, options?: Omit<NotificationOptions, "type">) =>
    manager.show(message, { ...options, type: "warning" }),
  info: (message: string, options?: Omit<NotificationOptions, "type">) =>
    manager.show(message, { ...options, type: "info" }),
  loading: (message: string, options?: Omit<NotificationOptions, "type">) =>
    manager.show(message, { ...options, type: "loading", dismissible: false }),
  dismiss: (id: string) => manager.dismiss(id),
  dismissAll: () => manager.dismissAll(),
  promise: toastPromise,
};

/**
 * Subscribe to notifications (for custom renderers)
 */
export function subscribeToNotifications(
  callback: (notifications: Notification[]) => void
): () => void {
  return manager.subscribe(callback);
}

/**
 * Get notification type styles (for custom rendering)
 */
export function getNotificationStyles(type: NotificationType): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
} {
  switch (type) {
    case "success":
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        borderColor: "border-green-200",
        iconColor: "text-green-500",
      };
    case "error":
      return {
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        borderColor: "border-red-200",
        iconColor: "text-red-500",
      };
    case "warning":
      return {
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
        iconColor: "text-yellow-500",
      };
    case "info":
      return {
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
        iconColor: "text-blue-500",
      };
    case "loading":
      return {
        bgColor: "bg-gray-50",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
        iconColor: "text-gray-500",
      };
  }
}
