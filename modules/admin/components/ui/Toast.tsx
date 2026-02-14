"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

import { cn } from "@lib/utils/style";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Hook to use toast system
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({ type: "error", title, message, duration: 8000 }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="z-toast pointer-events-none fixed right-0 bottom-0 flex flex-col gap-2 p-4 sm:max-w-md"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [onRemove, toast.id]);

  // Icon based on type
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "gng-check-circle";
      case "error":
        return "gng-alert-circle";
      case "warning":
        return "gng-alert-triangle";
      case "info":
        return "gng-info";
      default:
        return "gng-info";
    }
  };

  // Colors based on type
  const getColors = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-action-900 border-action-700",
          icon: "text-action-400",
          title: "text-action-300",
        };
      case "error":
        return {
          bg: "bg-error/10 border-error/30",
          icon: "text-error",
          title: "text-error",
        };
      case "warning":
        return {
          bg: "bg-warning/10 border-warning/30",
          icon: "text-warning",
          title: "text-warning",
        };
      case "info":
        return {
          bg: "bg-purple/10 border-purple/30",
          icon: "text-purple",
          title: "text-purple",
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-lg border p-4 shadow-lg backdrop-blur-sm",
        "transform transition-all duration-200",
        isLeaving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
        colors.bg
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <i className={cn(getIcon(), "mt-0.5 text-lg", colors.icon)} />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", colors.title)}>{toast.title}</p>
          {toast.message && <p className="text-grey-300 mt-1 text-sm">{toast.message}</p>}

          {/* Action Button */}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                handleRemove();
              }}
              className={cn(
                "mt-2 text-sm font-medium underline transition-colors hover:no-underline",
                colors.title
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleRemove}
          className="text-grey-500 hover:text-grey-300 -mt-1 -mr-1 flex h-6 w-6 items-center justify-center rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <i className="gng-x text-sm" />
        </button>
      </div>
    </div>
  );
}

// Export a standalone toast function for use outside React context
let toastRef: ToastContextValue | null = null;

export function setToastRef(ref: ToastContextValue) {
  toastRef = ref;
}

export const toast = {
  success: (title: string, message?: string) => toastRef?.success(title, message),
  error: (title: string, message?: string) => toastRef?.error(title, message),
  warning: (title: string, message?: string) => toastRef?.warning(title, message),
  info: (title: string, message?: string) => toastRef?.info(title, message),
};
