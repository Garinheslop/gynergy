"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

import { cn } from "@lib/utils/style";

// Types
type Politeness = "polite" | "assertive" | "off";

interface LiveRegionContextValue {
  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param politeness - "polite" (wait for user idle) or "assertive" (interrupt immediately)
   */
  announce: (message: string, politeness?: Politeness) => void;
  /**
   * Clear all announcements
   */
  clear: () => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

/**
 * Hook to access live region announcements
 */
export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error("useLiveRegion must be used within a LiveRegionProvider");
  }
  return context;
}

interface LiveRegionProviderProps {
  children: ReactNode;
  /** Delay before clearing announcements (ms) */
  clearDelay?: number;
}

/**
 * Provider for ARIA live region announcements
 *
 * @example
 * ```tsx
 * // In layout or app root
 * <LiveRegionProvider>
 *   <App />
 * </LiveRegionProvider>
 *
 * // In any component
 * function MyComponent() {
 *   const { announce } = useLiveRegion();
 *
 *   const handleSave = async () => {
 *     await saveData();
 *     announce("Data saved successfully");
 *   };
 * }
 * ```
 */
export function LiveRegionProvider({ children, clearDelay = 5000 }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const politeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const assertiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      if (politeness === "off") return;

      if (politeness === "assertive") {
        // Clear any existing timeout
        if (assertiveTimeoutRef.current) {
          clearTimeout(assertiveTimeoutRef.current);
        }

        // Set message (clear first to ensure re-announcement of same message)
        setAssertiveMessage("");
        requestAnimationFrame(() => {
          setAssertiveMessage(message);
        });

        // Auto-clear after delay
        assertiveTimeoutRef.current = setTimeout(() => {
          setAssertiveMessage("");
        }, clearDelay);
      } else {
        // Clear any existing timeout
        if (politeTimeoutRef.current) {
          clearTimeout(politeTimeoutRef.current);
        }

        // Set message
        setPoliteMessage("");
        requestAnimationFrame(() => {
          setPoliteMessage(message);
        });

        // Auto-clear after delay
        politeTimeoutRef.current = setTimeout(() => {
          setPoliteMessage("");
        }, clearDelay);
      }
    },
    [clearDelay]
  );

  const clear = useCallback(() => {
    setPoliteMessage("");
    setAssertiveMessage("");
    if (politeTimeoutRef.current) {
      clearTimeout(politeTimeoutRef.current);
    }
    if (assertiveTimeoutRef.current) {
      clearTimeout(assertiveTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce, clear }}>
      {children}

      {/* Polite live region - waits for user idle */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>

      {/* Assertive live region - interrupts immediately */}
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

/**
 * Standalone live region component for specific announcements
 */
interface LiveRegionProps {
  /** The message to announce */
  message: string;
  /** Politeness level */
  politeness?: Politeness;
  /** Whether to announce when message changes */
  announceOnChange?: boolean;
  /** Additional class name */
  className?: string;
}

export function LiveRegion({
  message,
  politeness = "polite",
  announceOnChange = true,
  className,
}: LiveRegionProps) {
  const [announced, setAnnounced] = useState(message);

  useEffect(() => {
    if (announceOnChange && message !== announced) {
      // Clear briefly to trigger re-announcement
      setAnnounced("");
      requestAnimationFrame(() => {
        setAnnounced(message);
      });
    }
  }, [message, announced, announceOnChange]);

  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {announced}
    </div>
  );
}

/**
 * Visual live region that shows content to all users
 * Useful for status messages that should be visible
 */
interface VisualLiveRegionProps {
  children: ReactNode;
  politeness?: Politeness;
  className?: string;
}

export function VisualLiveRegion({
  children,
  politeness = "polite",
  className,
}: VisualLiveRegionProps) {
  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Loading announcement component
 * Announces loading state changes to screen readers
 */
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = "Loading...",
  completeMessage = "Content loaded",
}: LoadingAnnouncerProps) {
  const [message, setMessage] = useState("");
  const previousLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (isLoading && !previousLoadingRef.current) {
      setMessage(loadingMessage);
    } else if (!isLoading && previousLoadingRef.current) {
      setMessage(completeMessage);
    }
    previousLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completeMessage]);

  if (!message) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
