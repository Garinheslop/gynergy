"use client";

import { useState, useEffect } from "react";

interface UseStickyVisibilityOptions {
  threshold?: number;
  hideAtBottom?: boolean;
  bottomOffset?: number;
}

export function useStickyVisibility(options: UseStickyVisibilityOptions = {}): boolean {
  const {
    threshold = 0.8, // Show after scrolling 80% of viewport height
    hideAtBottom = true,
    bottomOffset = 200,
  } = options;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollThreshold = viewportHeight * threshold;

      // Check if scrolled past threshold
      const pastThreshold = scrollY > scrollThreshold;

      // Check if near bottom of page
      const nearBottom = hideAtBottom
        ? scrollY + viewportHeight >= documentHeight - bottomOffset
        : false;

      setIsVisible(pastThreshold && !nearBottom);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, hideAtBottom, bottomOffset]);

  return isVisible;
}

export default useStickyVisibility;
