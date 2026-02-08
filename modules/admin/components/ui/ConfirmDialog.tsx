"use client";

import { useEffect, useCallback, useState, createContext, useContext, type ReactNode } from "react";

import { cn } from "@lib/utils/style";

// Dialog variants for different use cases
export type ConfirmDialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  confirmDisabled?: boolean;
}

const variantStyles: Record<
  ConfirmDialogVariant,
  { icon: string; iconBg: string; iconColor: string; buttonBg: string; buttonHover: string }
> = {
  danger: {
    icon: "gng-alert-triangle",
    iconBg: "bg-error/10",
    iconColor: "text-error",
    buttonBg: "bg-error",
    buttonHover: "hover:bg-error/90",
  },
  warning: {
    icon: "gng-alert-circle",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    buttonBg: "bg-warning",
    buttonHover: "hover:bg-warning/90",
  },
  info: {
    icon: "gng-info",
    iconBg: "bg-purple/10",
    iconColor: "text-purple",
    buttonBg: "bg-purple",
    buttonHover: "hover:bg-purple/90",
  },
  success: {
    icon: "gng-check-circle",
    iconBg: "bg-action-900",
    iconColor: "text-action-400",
    buttonBg: "bg-action-500",
    buttonHover: "hover:bg-action-600",
  },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const styles = variantStyles[variant];

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isConfirming) {
        onClose();
      }
    },
    [isOpen, onClose, isConfirming]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling done by caller
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isConfirming ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="bg-grey-900 border-grey-700 relative z-10 w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="p-6">
          {/* Icon */}
          <div
            className={cn(
              "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
              styles.iconBg
            )}
          >
            <i className={cn(styles.icon, "text-xl", styles.iconColor)} />
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 id="confirm-title" className="mb-2 text-lg font-semibold text-white">
              {title}
            </h3>
            <p id="confirm-description" className="text-grey-400 text-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-grey-800 flex gap-3 border-t bg-black/20 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="border-grey-700 bg-grey-800 hover:bg-grey-700 flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming || loading || confirmDisabled}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50",
              styles.buttonBg,
              styles.buttonHover
            )}
          >
            {isConfirming || loading ? (
              <>
                <i className="gng-loader animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm Dialog Context for programmatic usage
interface ConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    dialogState.resolve?.(false);
    setDialogState({ isOpen: false, options: null, resolve: null });
  };

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState({ isOpen: false, options: null, resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState.options && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          {...dialogState.options}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// Convenient delete confirmation
export function useDeleteConfirm() {
  const { confirm } = useConfirm();

  return useCallback(
    (itemName: string, itemType = "item") => {
      return confirm({
        title: `Delete ${itemType}?`,
        message: (
          <>
            Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be
            undone.
          </>
        ),
        confirmLabel: "Delete",
        cancelLabel: "Keep it",
        variant: "danger",
      });
    },
    [confirm]
  );
}

// Convenient action confirmation
export function useActionConfirm() {
  const { confirm } = useConfirm();

  return useCallback(
    (action: string, message: string, variant: ConfirmDialogVariant = "warning") => {
      return confirm({
        title: action,
        message,
        confirmLabel: "Proceed",
        variant,
      });
    },
    [confirm]
  );
}
