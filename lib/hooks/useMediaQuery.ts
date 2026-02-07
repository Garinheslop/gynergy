"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Hook to track a media query
 *
 * @example
 * ```tsx
 * function Layout() {
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 *   return isDesktop ? <DesktopNav /> : <MobileNav />;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Tailwind CSS breakpoint values
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to track Tailwind breakpoints
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
 *
 *   if (isMobile) return <MobileView />;
 *   if (isTablet) return <TabletView />;
 *   return <DesktopView />;
 * }
 * ```
 */
export function useBreakpoint(): {
  /** Current breakpoint name */
  breakpoint: Breakpoint | null;
  /** Is below sm breakpoint */
  isMobile: boolean;
  /** Is between sm and lg */
  isTablet: boolean;
  /** Is lg or above */
  isDesktop: boolean;
  /** Is xl or above */
  isLargeDesktop: boolean;
  /** Current viewport width */
  width: number;
  /** Check if viewport is at least a given breakpoint */
  isAtLeast: (bp: Breakpoint) => boolean;
  /** Check if viewport is at most a given breakpoint */
  isAtMost: (bp: Breakpoint) => boolean;
} {
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const breakpoint = useMemo((): Breakpoint | null => {
    if (width >= breakpoints["2xl"]) return "2xl";
    if (width >= breakpoints.xl) return "xl";
    if (width >= breakpoints.lg) return "lg";
    if (width >= breakpoints.md) return "md";
    if (width >= breakpoints.sm) return "sm";
    return null;
  }, [width]);

  const isMobile = width < breakpoints.sm;
  const isTablet = width >= breakpoints.sm && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;
  const isLargeDesktop = width >= breakpoints.xl;

  const isAtLeast = useCallback(
    (bp: Breakpoint): boolean => {
      return width >= breakpoints[bp];
    },
    [width]
  );

  const isAtMost = useCallback(
    (bp: Breakpoint): boolean => {
      return width < breakpoints[bp];
    },
    [width]
  );

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    width,
    isAtLeast,
    isAtMost,
  };
}

/**
 * Hook to detect user's preferred color scheme
 *
 * @example
 * ```tsx
 * function App() {
 *   const prefersDark = usePrefersDarkMode();
 *   return <ThemeProvider theme={prefersDark ? 'dark' : 'light'} />;
 * }
 * ```
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

/**
 * Hook to detect if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function Animated() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ x: 100 }}
 *       transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *     />
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook to detect if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery("(prefers-contrast: more)");
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): "portrait" | "landscape" {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  return isPortrait ? "portrait" : "landscape";
}

/**
 * Hook to detect if device supports hover
 * Useful for distinguishing touch vs mouse devices
 */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover)");
}

/**
 * Hook to detect if device has coarse pointer (touch)
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

/**
 * Hook for responsive values based on breakpoints
 *
 * @example
 * ```tsx
 * function Component() {
 *   const columns = useResponsiveValue({
 *     base: 1,
 *     sm: 2,
 *     md: 3,
 *     lg: 4,
 *   });
 *
 *   return <Grid columns={columns} />;
 * }
 * ```
 */
export function useResponsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T {
  const { breakpoint, isMobile } = useBreakpoint();

  return useMemo(() => {
    if (isMobile) return values.base;

    // Get the value for the current breakpoint or fall back to smaller ones
    const breakpointOrder: Breakpoint[] = ["sm", "md", "lg", "xl", "2xl"];
    const currentIndex = breakpoint ? breakpointOrder.indexOf(breakpoint) : -1;

    // Find the largest defined value at or below current breakpoint
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp] as T;
      }
    }

    return values.base;
  }, [values, breakpoint, isMobile]);
}

/**
 * Hook to track window dimensions
 */
export function useWindowSize(): {
  width: number;
  height: number;
  isLoading: boolean;
} {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isLoading: false,
      });
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
