import { useEffect, useCallback, useRef } from "react";

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutHandler[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow Escape key in inputs
        if (event.key !== "Escape") {
          return;
        }
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const _ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const _metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for Cmd/Ctrl on Mac/Windows
        const cmdOrCtrl = shortcut.meta || shortcut.ctrl;
        const cmdOrCtrlMatch = cmdOrCtrl
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;

        if (keyMatch && cmdOrCtrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.filter((s) => s.enabled !== false),
  };
}

// Pre-defined admin shortcuts
export function useAdminShortcuts({
  onSearch,
  onToggleAria,
  onNavigate,
}: {
  onSearch?: () => void;
  onToggleAria?: () => void;
  onNavigate?: (path: string) => void;
}) {
  const shortcuts: ShortcutHandler[] = [
    // Global shortcuts
    {
      key: "k",
      meta: true,
      handler: () => onSearch?.(),
      description: "Open search",
      enabled: !!onSearch,
    },
    {
      key: "a",
      meta: true,
      shift: true,
      handler: () => onToggleAria?.(),
      description: "Toggle Aria AI",
      enabled: !!onToggleAria,
    },
    // Navigation shortcuts (with 'g' prefix concept - press g then key)
    {
      key: "1",
      meta: true,
      handler: () => onNavigate?.("/admin"),
      description: "Go to Dashboard",
      enabled: !!onNavigate,
    },
    {
      key: "2",
      meta: true,
      handler: () => onNavigate?.("/admin/users"),
      description: "Go to Users",
      enabled: !!onNavigate,
    },
    {
      key: "3",
      meta: true,
      handler: () => onNavigate?.("/admin/payments"),
      description: "Go to Payments",
      enabled: !!onNavigate,
    },
    {
      key: "4",
      meta: true,
      handler: () => onNavigate?.("/admin/analytics"),
      description: "Go to Analytics",
      enabled: !!onNavigate,
    },
    {
      key: "5",
      meta: true,
      handler: () => onNavigate?.("/admin/community"),
      description: "Go to Community",
      enabled: !!onNavigate,
    },
  ];

  return useKeyboardShortcuts({ shortcuts });
}

// Hook to display keyboard shortcut hints
export function formatShortcut(shortcut: ShortcutHandler): string {
  const parts: string[] = [];

  const isMac =
    typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  if (shortcut.meta || shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
}
