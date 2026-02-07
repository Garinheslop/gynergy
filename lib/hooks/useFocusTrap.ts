"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Focus trap utility for modals and dialogs
 * Ensures keyboard focus stays within a container for accessibility
 */

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]",
  "audio[controls]",
  "video[controls]",
  "details>summary:first-of-type",
  "details",
].join(", ");

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
  return Array.from(elements).filter(
    (el) =>
      !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden") && el.offsetParent !== null
  );
}

interface UseFocusTrapOptions {
  /** Whether the trap is active */
  isActive: boolean;
  /** Whether to auto-focus the first element when trap activates */
  autoFocus?: boolean;
  /** Whether to restore focus when trap deactivates */
  restoreFocus?: boolean;
  /** Initial element to focus (overrides autoFocus) */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Element to return focus to (overrides restoreFocus) */
  returnFocusRef?: React.RefObject<HTMLElement>;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

/**
 * Hook to trap focus within a container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   return (
 *     <div ref={containerRef} role="dialog">
 *       <button>Focusable</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions
): React.RefObject<T> {
  const {
    isActive,
    autoFocus = true,
    restoreFocus = true,
    initialFocusRef,
    returnFocusRef,
    onEscape,
  } = options;

  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when trap activates
  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
    }
  }, [isActive]);

  // Handle initial focus
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Focus initial element or first focusable
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (autoFocus) {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // If no focusable elements, focus the container itself
        container.setAttribute("tabindex", "-1");
        container.focus();
      }
    }
  }, [isActive, autoFocus, initialFocusRef]);

  // Handle focus restoration
  useEffect(() => {
    if (isActive) return;

    // Restore focus when trap deactivates
    if (restoreFocus) {
      const elementToFocus = returnFocusRef?.current || previouslyFocusedRef.current;
      if (elementToFocus && document.body.contains(elementToFocus)) {
        elementToFocus.focus();
      }
    }
  }, [isActive, restoreFocus, returnFocusRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Handle Escape
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      // Handle Tab
      if (event.key === "Tab") {
        const container = containerRef.current;
        const focusable = getFocusableElements(container);

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement;

        // Shift + Tab: go to last element if on first
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab: go to first element if on last
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If focus is outside container, move it inside
        if (!container.contains(activeElement)) {
          event.preventDefault();
          if (event.shiftKey) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
        }
      }
    },
    [isActive, onEscape]
  );

  // Attach keyboard listener
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  // Prevent focus from leaving container via click
  useEffect(() => {
    if (!isActive) return;

    const handleFocusIn = (event: FocusEvent) => {
      if (!containerRef.current) return;

      const target = event.target as HTMLElement;
      if (!containerRef.current.contains(target)) {
        event.preventDefault();
        event.stopPropagation();

        const focusable = getFocusableElements(containerRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to lock body scroll when modal is open
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    // Get scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll and compensate for scrollbar
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.paddingRight = originalStyle.paddingRight;
    };
  }, [isLocked]);
}

/**
 * Combined hook for modal accessibility
 */
interface UseModalAccessibilityOptions extends UseFocusTrapOptions {
  /** Whether to lock body scroll */
  lockScroll?: boolean;
}

export function useModalAccessibility<T extends HTMLElement = HTMLDivElement>(
  options: UseModalAccessibilityOptions
): React.RefObject<T> {
  const { lockScroll = true, ...focusTrapOptions } = options;

  const containerRef = useFocusTrap<T>(focusTrapOptions);
  useScrollLock(options.isActive && lockScroll);

  return containerRef;
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
