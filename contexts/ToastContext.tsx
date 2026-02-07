"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

import { cn } from "@lib/utils/style";

// Toast types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
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
  clearToasts: () => void;
  // Convenience methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = "top-right",
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = toast.duration ?? 5000;

      setToasts((prev) => {
        const newToasts = [...prev, { ...toast, id }];
        // Keep only the most recent toasts
        return newToasts.slice(-maxToasts);
      });

      // Auto-remove after duration (unless duration is 0)
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
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

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      {/* Toast Container */}
      <div
        className={cn(
          "pointer-events-none fixed z-50 flex flex-col gap-2",
          positionClasses[position]
        )}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Individual toast item
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons: Record<ToastType, string> = {
    success: "gng-check-circle",
    error: "gng-alert-circle",
    warning: "gng-alert-triangle",
    info: "gng-info",
  };

  const colors: Record<ToastType, string> = {
    success: "border-success bg-success/10 text-success",
    error: "border-danger bg-danger/10 text-danger",
    warning: "border-warning bg-warning/10 text-warning",
    info: "border-action-500 bg-action-500/10 text-action-400",
  };

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-lg border p-4 shadow-lg backdrop-blur-sm",
        "animate-in slide-in-from-right-full duration-300",
        colors[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <i className={cn(icons[toast.type], "mt-0.5 shrink-0 text-lg")} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm opacity-80">{toast.message}</p>}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <i className="gng-close text-sm" />
        </button>
      </div>
    </div>
  );
}
