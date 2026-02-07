"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@lib/utils/style";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // Focus cancel button by default for safety
      cancelButtonRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
  );

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling should be done in the onConfirm callback
    }
  }, [onConfirm, onClose]);

  const variantStyles = {
    danger: {
      icon: "gng-alert-triangle",
      iconBg: "bg-danger/20",
      iconColor: "text-danger",
      buttonBg: "bg-danger hover:bg-danger/90",
    },
    warning: {
      icon: "gng-alert-circle",
      iconBg: "bg-warning/20",
      iconColor: "text-warning",
      buttonBg: "bg-warning hover:bg-warning/90 text-grey-900",
    },
    default: {
      icon: "gng-help-circle",
      iconBg: "bg-action-500/20",
      iconColor: "text-action-400",
      buttonBg: "bg-action-600 hover:bg-action-500",
    },
  };

  const styles = variantStyles[variant];

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="border-grey-700 bg-grey-900 fixed inset-0 z-50 m-auto max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div className="p-6">
        {/* Icon */}
        <div
          className={cn(
            "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
            styles.iconBg
          )}
        >
          <i className={cn(styles.icon, styles.iconColor, "text-2xl")} />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 id="dialog-title" className="mb-2 text-lg font-semibold text-white">
            {title}
          </h2>
          <p id="dialog-description" className="text-grey-400 text-sm">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={isLoading}
            className="border-grey-700 bg-grey-800 hover:bg-grey-700 flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50",
              styles.buttonBg
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// Hook for easier usage

interface UseConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export function useConfirm(defaultOptions?: Partial<UseConfirmOptions>) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>({
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    ...defaultOptions,
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((customOptions?: Partial<UseConfirmOptions>): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions((prev) => ({ ...prev, ...customOptions }));
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolver?.(true);
    setResolver(null);
  }, [resolver]);

  const Dialog = useCallback(
    () => (
      <ConfirmDialog isOpen={isOpen} onClose={handleClose} onConfirm={handleConfirm} {...options} />
    ),
    [isOpen, handleClose, handleConfirm, options]
  );

  return { confirm, Dialog };
}
