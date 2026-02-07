"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keyboard Shortcuts Hook
 *
 * Handle keyboard shortcuts with support for modifiers,
 * sequences, scopes, and conflict resolution.
 */

/**
 * Modifier keys
 */
export type ModifierKey = "ctrl" | "alt" | "shift" | "meta" | "cmd";

/**
 * Key combination
 */
export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Shortcut definition
 */
export interface Shortcut {
  keys: string | string[];
  handler: (e: KeyboardEvent) => void;
  description?: string;
  scope?: string;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  repeat?: boolean;
}

/**
 * Keyboard options
 */
export interface KeyboardOptions {
  scope?: string;
  enabled?: boolean;
  target?: HTMLElement | Window | null;
  ignoreInputs?: boolean;
  ignoreContentEditable?: boolean;
}

/**
 * Parse a key string into KeyCombo
 */
function parseKeyCombo(keyString: string): KeyCombo {
  const parts = keyString
    .toLowerCase()
    .split("+")
    .map((s) => s.trim());
  const combo: KeyCombo = { key: "" };

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        combo.ctrl = true;
        break;
      case "alt":
      case "option":
        combo.alt = true;
        break;
      case "shift":
        combo.shift = true;
        break;
      case "meta":
      case "cmd":
      case "command":
      case "win":
      case "windows":
        combo.meta = true;
        break;
      default:
        combo.key = part;
    }
  }

  return combo;
}

/**
 * Check if event matches key combo
 */
function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const eventKey = event.key.toLowerCase();
  const comboKey = combo.key.toLowerCase();

  // Handle special key names
  const keyMatches =
    eventKey === comboKey ||
    event.code.toLowerCase() === comboKey ||
    event.code.toLowerCase() === `key${comboKey}` ||
    (comboKey === "space" && eventKey === " ") ||
    (comboKey === "esc" && eventKey === "escape") ||
    (comboKey === "del" && eventKey === "delete") ||
    (comboKey === "return" && eventKey === "enter");

  if (!keyMatches) return false;

  // Check modifiers
  if (combo.ctrl && !event.ctrlKey) return false;
  if (combo.alt && !event.altKey) return false;
  if (combo.shift && !event.shiftKey) return false;
  if (combo.meta && !event.metaKey) return false;

  // Make sure no extra modifiers are pressed
  if (event.ctrlKey && !combo.ctrl) return false;
  if (event.altKey && !combo.alt) return false;
  if (event.metaKey && !combo.meta) return false;
  // Shift is more lenient (for capital letters)
  if (event.shiftKey && !combo.shift && combo.key.length === 1) return false;

  return true;
}

/**
 * Check if target is an input element
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  );
}

/**
 * Global shortcut registry for scope management
 */
const globalRegistry = {
  activeScope: "global",
  shortcuts: new Map<string, Shortcut[]>(),
};

/**
 * Set the active scope
 */
export function setKeyboardScope(scope: string): void {
  globalRegistry.activeScope = scope;
}

/**
 * Get the active scope
 */
export function getKeyboardScope(): string {
  return globalRegistry.activeScope;
}

/**
 * Single keyboard shortcut hook
 */
export function useHotkey(
  keys: string | string[],
  handler: (e: KeyboardEvent) => void,
  options: Omit<KeyboardOptions, "scope"> & { deps?: unknown[] } = {}
): void {
  const {
    enabled = true,
    target,
    ignoreInputs = true,
    ignoreContentEditable = true,
    deps = [],
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const keyStrings = Array.isArray(keys) ? keys : [keys];
    const combos = keyStrings.map(parseKeyCombo);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input
      if (ignoreInputs && isInputElement(e.target)) {
        return;
      }

      // Ignore content editable
      if (ignoreContentEditable && (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Check if any combo matches
      if (combos.some((combo) => matchesKeyCombo(e, combo))) {
        e.preventDefault();
        handlerRef.current(e);
      }
    };

    const targetElement = target || (typeof window !== "undefined" ? window : null);
    if (!targetElement) return;

    targetElement.addEventListener("keydown", handleKeyDown as EventListener);
    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, enabled, target, ignoreInputs, ignoreContentEditable, ...deps]);
}

/**
 * Multiple keyboard shortcuts hook
 */
export function useHotkeys(shortcuts: Shortcut[], options: KeyboardOptions = {}): void {
  const {
    scope = "global",
    enabled = true,
    target,
    ignoreInputs = true,
    ignoreContentEditable = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check scope
      if (scope !== "global" && globalRegistry.activeScope !== scope) {
        return;
      }

      // Ignore if in input
      if (ignoreInputs && isInputElement(e.target)) {
        return;
      }

      // Ignore content editable
      if (ignoreContentEditable && (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;
        if (shortcut.scope && shortcut.scope !== globalRegistry.activeScope) continue;
        if (!shortcut.repeat && e.repeat) continue;

        const keyStrings = Array.isArray(shortcut.keys) ? shortcut.keys : [shortcut.keys];
        const combos = keyStrings.map(parseKeyCombo);

        if (combos.some((combo) => matchesKeyCombo(e, combo))) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          if (shortcut.stopPropagation) {
            e.stopPropagation();
          }
          shortcut.handler(e);
          return;
        }
      }
    };

    const targetElement = target || (typeof window !== "undefined" ? window : null);
    if (!targetElement) return;

    targetElement.addEventListener("keydown", handleKeyDown as EventListener);
    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [scope, enabled, target, ignoreInputs, ignoreContentEditable]);
}

/**
 * Key sequence hook (e.g., "g i" for go to inbox)
 */
export function useKeySequence(
  sequence: string,
  handler: () => void,
  options: {
    timeout?: number;
    enabled?: boolean;
  } = {}
): void {
  const { timeout = 1000, enabled = true } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const [buffer, setBuffer] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const keys = sequence.split(/\s+/).map((k) => k.toLowerCase());

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input
      if (isInputElement(e.target)) return;

      // Clear timeout and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const key = e.key.toLowerCase();
      const newBuffer = [...buffer, key];

      // Check if sequence matches
      const matches = keys.every((k, i) => newBuffer[newBuffer.length - keys.length + i] === k);

      if (matches && newBuffer.length >= keys.length) {
        e.preventDefault();
        handlerRef.current();
        setBuffer([]);
        return;
      }

      // Update buffer
      setBuffer(newBuffer.slice(-10)); // Keep last 10 keys

      // Set timeout to clear buffer
      timeoutRef.current = setTimeout(() => {
        setBuffer([]);
      }, timeout);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, buffer, keys, timeout]);
}

/**
 * Check if a specific key is currently pressed
 */
export function useKeyPressed(key: string): boolean {
  const [isPressed, setIsPressed] = useState(false);
  const targetKey = key.toLowerCase();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === targetKey) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === targetKey) {
        setIsPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [targetKey]);

  return isPressed;
}

/**
 * Track all currently pressed keys
 */
export function usePressedKeys(): Set<string> {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    const handleBlur = () => {
      setPressedKeys(new Set());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return pressedKeys;
}

/**
 * Keyboard shortcuts help dialog data
 */
export function useShortcutHelp(shortcuts: Shortcut[]): {
  groups: Map<string, Shortcut[]>;
  all: Shortcut[];
} {
  const groups = new Map<string, Shortcut[]>();
  const all: Shortcut[] = [];

  for (const shortcut of shortcuts) {
    if (!shortcut.description) continue;

    all.push(shortcut);

    const scope = shortcut.scope || "General";
    if (!groups.has(scope)) {
      groups.set(scope, []);
    }
    groups.get(scope)!.push(shortcut);
  }

  return { groups, all };
}

/**
 * Common keyboard shortcuts
 */
export const CommonShortcuts = {
  SAVE: "ctrl+s",
  UNDO: "ctrl+z",
  REDO: "ctrl+shift+z",
  CUT: "ctrl+x",
  COPY: "ctrl+c",
  PASTE: "ctrl+v",
  SELECT_ALL: "ctrl+a",
  FIND: "ctrl+f",
  NEW: "ctrl+n",
  OPEN: "ctrl+o",
  CLOSE: "ctrl+w",
  ESCAPE: "escape",
  ENTER: "enter",
  TAB: "tab",
  DELETE: "delete",
  BACKSPACE: "backspace",
  HELP: "?",

  // Navigation
  UP: "arrowup",
  DOWN: "arrowdown",
  LEFT: "arrowleft",
  RIGHT: "arrowright",
  HOME: "home",
  END: "end",
  PAGE_UP: "pageup",
  PAGE_DOWN: "pagedown",

  // App-specific
  TOGGLE_SIDEBAR: "ctrl+b",
  COMMAND_PALETTE: "ctrl+k",
  QUICK_SEARCH: "ctrl+shift+f",
  SETTINGS: "ctrl+,",
} as const;

/**
 * Create a keyboard shortcut string for display
 */
export function formatShortcut(keys: string): string {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return keys
    .split("+")
    .map((key) => {
      const k = key.trim().toLowerCase();
      switch (k) {
        case "ctrl":
        case "control":
          return isMac ? "⌃" : "Ctrl";
        case "alt":
        case "option":
          return isMac ? "⌥" : "Alt";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "meta":
        case "cmd":
        case "command":
          return isMac ? "⌘" : "Win";
        case "enter":
        case "return":
          return "↵";
        case "escape":
        case "esc":
          return "Esc";
        case "backspace":
          return "⌫";
        case "delete":
          return "Del";
        case "tab":
          return "⇥";
        case "space":
          return "Space";
        case "arrowup":
          return "↑";
        case "arrowdown":
          return "↓";
        case "arrowleft":
          return "←";
        case "arrowright":
          return "→";
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? "" : " + ");
}
