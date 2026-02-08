"use client";

import { useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open quick search" },
      { keys: ["⌘", "."], description: "Toggle Aria AI assistant" },
      { keys: ["⌘", "?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modal / panel" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "U"], description: "Go to Users" },
      { keys: ["G", "A"], description: "Go to Analytics" },
      { keys: ["G", "P"], description: "Go to Payments" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["⌘", "S"], description: "Save changes" },
      { keys: ["⌘", "E"], description: "Export data" },
      { keys: ["⌘", "R"], description: "Refresh data" },
      { keys: ["⌘", "N"], description: "Create new item" },
      { keys: ["Del"], description: "Delete selected" },
    ],
  },
  {
    title: "Table Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Space"], description: "Select / deselect row" },
      { keys: ["⌘", "A"], description: "Select all" },
      { keys: ["Enter"], description: "Open selected item" },
    ],
  },
  {
    title: "Aria AI",
    shortcuts: [
      { keys: ["⌘", "."], description: "Open Aria panel" },
      { keys: ["⌘", "Enter"], description: "Send message" },
      { keys: ["⌘", "↑"], description: "Previous message" },
      { keys: ["Esc"], description: "Close Aria" },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent scroll when modal is open
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="bg-grey-900 border-grey-700 relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="border-grey-800 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-action-900 flex h-10 w-10 items-center justify-center rounded-lg">
              <i className="gng-command text-action-400 text-lg" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-lg font-semibold text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-grey-400 text-sm">Navigate like a pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-grey-400 hover:bg-grey-800 hover:text-grey-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            aria-label="Close shortcuts modal"
          >
            <i className="gng-x" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-8 md:grid-cols-2">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-grey-300 mb-3 text-sm font-semibold tracking-wider uppercase">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="hover:bg-grey-800/50 flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="text-grey-300 text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd
                              className={cn(
                                "bg-grey-800 border-grey-700 inline-flex min-w-[28px] items-center justify-center rounded border px-2 py-1 text-xs font-medium text-white shadow-sm",
                                key.length === 1 && "min-w-[28px]"
                              )}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-grey-600 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-grey-800 bg-grey-900/50 border-t px-6 py-4">
          <div className="text-grey-500 flex items-center justify-between text-sm">
            <span>
              Press <kbd className="bg-grey-800 rounded px-1.5 py-0.5 text-xs">Esc</kbd> to close
            </span>
            <span className="text-grey-600">
              Tip: Use <kbd className="bg-grey-800 rounded px-1.5 py-0.5 text-xs">G</kbd> then a
              letter for quick navigation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage keyboard shortcuts modal
export function useKeyboardShortcuts() {
  const handleGlobalShortcuts = useCallback(
    (callback: {
      onSearch?: () => void;
      onAria?: () => void;
      onShortcuts?: () => void;
      onExport?: () => void;
      onRefresh?: () => void;
      onNavigate?: (path: string) => void;
    }) => {
      let gPressed = false;
      let gTimeout: NodeJS.Timeout;

      const handler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

        // Don't trigger shortcuts when typing in inputs (except for Cmd shortcuts)
        if (isInput && !e.metaKey && !e.ctrlKey) {
          gPressed = false;
          return;
        }

        // Cmd/Ctrl + K - Search
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          callback.onSearch?.();
          return;
        }

        // Cmd/Ctrl + . - Aria
        if ((e.metaKey || e.ctrlKey) && e.key === ".") {
          e.preventDefault();
          callback.onAria?.();
          return;
        }

        // Cmd/Ctrl + ? or Cmd/Ctrl + / - Shortcuts
        if ((e.metaKey || e.ctrlKey) && (e.key === "?" || e.key === "/")) {
          e.preventDefault();
          callback.onShortcuts?.();
          return;
        }

        // Cmd/Ctrl + E - Export
        if ((e.metaKey || e.ctrlKey) && e.key === "e") {
          e.preventDefault();
          callback.onExport?.();
          return;
        }

        // Cmd/Ctrl + R - Refresh (prevent default browser refresh)
        if ((e.metaKey || e.ctrlKey) && e.key === "r") {
          e.preventDefault();
          callback.onRefresh?.();
          return;
        }

        // G + letter navigation
        if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey && !isInput) {
          gPressed = true;
          clearTimeout(gTimeout);
          gTimeout = setTimeout(() => {
            gPressed = false;
          }, 500);
          return;
        }

        if (gPressed && !isInput) {
          const routes: Record<string, string> = {
            d: "/admin",
            u: "/admin/users",
            a: "/admin/analytics",
            p: "/admin/payments",
            c: "/admin/content",
            m: "/admin/community",
            s: "/admin/settings",
          };

          const path = routes[e.key.toLowerCase()];
          if (path) {
            e.preventDefault();
            callback.onNavigate?.(path);
          }
          gPressed = false;
        }
      };

      document.addEventListener("keydown", handler);
      return () => {
        document.removeEventListener("keydown", handler);
        clearTimeout(gTimeout);
      };
    },
    []
  );

  return { handleGlobalShortcuts };
}
