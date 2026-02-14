"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseExitIntentOptions {
  threshold?: number;
  delay?: number;
  storageKey?: string;
  disabled?: boolean;
  /** Minimum scroll depth (0-1) before mobile exit intent can trigger */
  mobileScrollDepth?: number;
  /** Minimum time on page (ms) before mobile exit intent can trigger */
  mobileMinTimeOnPage?: number;
}

export function useExitIntent(options: UseExitIntentOptions = {}): {
  showPopup: boolean;
  closePopup: () => void;
  resetPopup: () => void;
} {
  const {
    threshold = 0,
    delay = 0,
    storageKey = "exitIntentShown",
    disabled = false,
    mobileScrollDepth = 0.25, // Must scroll 25% before trigger is armed
    mobileMinTimeOnPage = 10000, // Must be on page 10 seconds
  } = options;

  const [showPopup, setShowPopup] = useState(false);
  const hasTriggered = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageLoadTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const lastScrollY = useRef(0);
  const rapidScrollUpCount = useRef(0);

  const closePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const resetPopup = useCallback(() => {
    hasTriggered.current = false;
    maxScrollDepth.current = 0;
    rapidScrollUpCount.current = 0;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const triggerPopup = useCallback(() => {
    if (hasTriggered.current || sessionStorage.getItem(storageKey)) return;

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setShowPopup(true);
        hasTriggered.current = true;
        sessionStorage.setItem(storageKey, "true");
      }, delay);
    } else {
      setShowPopup(true);
      hasTriggered.current = true;
      sessionStorage.setItem(storageKey, "true");
    }
  }, [delay, storageKey]);

  useEffect(() => {
    if (disabled) return;

    // Check if already shown this session
    if (typeof window !== "undefined") {
      const alreadyShown = sessionStorage.getItem(storageKey);
      if (alreadyShown) {
        hasTriggered.current = true;
      }
    }

    // Detect if user is on mobile/touch device
    const isTouchDevice =
      typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // Desktop: Mouse leave detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= threshold && !hasTriggered.current) {
        triggerPopup();
      }
    };

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Mobile: Scroll behavior detection
    const handleScroll = () => {
      if (hasTriggered.current) return;

      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = docHeight > 0 ? scrollY / docHeight : 0;

      // Track max scroll depth
      if (scrollDepth > maxScrollDepth.current) {
        maxScrollDepth.current = scrollDepth;
      }

      // Check for rapid scroll up (exit intent signal on mobile)
      const scrollDelta = lastScrollY.current - scrollY;
      const timeOnPage = Date.now() - pageLoadTime.current;

      // Conditions for mobile exit intent:
      // 1. User has scrolled past minimum depth
      // 2. User has been on page for minimum time
      // 3. User is rapidly scrolling up (>100px jump)
      // 4. User is near top of page after being lower
      if (
        isTouchDevice &&
        maxScrollDepth.current >= mobileScrollDepth &&
        timeOnPage >= mobileMinTimeOnPage &&
        scrollDelta > 100 &&
        scrollY < 200 &&
        maxScrollDepth.current > 0.3
      ) {
        rapidScrollUpCount.current++;

        // Trigger after 2 rapid scroll-ups to avoid false positives
        if (rapidScrollUpCount.current >= 2) {
          triggerPopup();
        }
      }

      lastScrollY.current = scrollY;
    };

    // Add event listeners
    if (!isTouchDevice) {
      document.addEventListener("mouseleave", handleMouseLeave);
      document.addEventListener("mouseenter", handleMouseEnter);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    threshold,
    delay,
    storageKey,
    disabled,
    mobileScrollDepth,
    mobileMinTimeOnPage,
    triggerPopup,
  ]);

  return { showPopup, closePopup, resetPopup };
}

export default useExitIntent;
