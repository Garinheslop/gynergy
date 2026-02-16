/**
 * Animation Utilities
 *
 * Centralized animation constants and utilities that correspond to
 * CSS custom properties defined in globals.css.
 *
 * Usage:
 * ```tsx
 * import { transitions, animations, durations } from '@lib/utils/animation';
 *
 * // In Tailwind className
 * className={transitions.normal}
 *
 * // For framer-motion or JS animations
 * transition={{ duration: durations.normal / 1000 }}
 * ```
 */

// Duration values in milliseconds (matching CSS --duration-* tokens)
export const durations = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
} as const;

// Easing functions (matching CSS --ease-* tokens)
export const easings = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

// Tailwind transition class combinations
export const transitions = {
  // Basic transitions
  none: "transition-none",
  all: "transition-all",
  colors: "transition-colors",
  opacity: "transition-opacity",
  shadow: "transition-shadow",
  transform: "transition-transform",

  // Speed variants (apply after base transition)
  fast: "duration-150 ease-out",
  normal: "duration-250 ease-out",
  slow: "duration-400 ease-out",

  // Common combinations
  fadefast: "transition-opacity duration-150 ease-out",
  fadeNormal: "transition-opacity duration-250 ease-out",
  scalefast: "transition-transform duration-150 ease-out",
  scaleNormal: "transition-transform duration-250 ease-out",
  allFast: "transition-all duration-150 ease-out",
  allNormal: "transition-all duration-250 ease-out",
  allSlow: "transition-all duration-400 ease-out",
  bounce: "transition-all duration-300 ease-bounce",
} as const;

// Animation class names (matching CSS .animate-* classes in globals.css)
export const animations = {
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut",
  slideUp: "animate-slideUp",
  slideDown: "animate-slideDown",
  scaleIn: "animate-scaleIn",
  scaleOut: "animate-scaleOut",
  spin: "animate-spin",
  pulse: "animate-pulse",
  ping: "animate-ping",
  bounce: "animate-bounce",

  // Landing page specific
  lpRevealUp: "lp-reveal-up",
  lpRevealScale: "lp-reveal-scale",
  lpGoldPulse: "lp-gold-pulse",
  lpGoldShimmer: "lp-gold-shimmer",
} as const;

// Z-index scale (matching CSS --z-* tokens)
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Tailwind z-index classes (for direct className usage)
export const zIndexClasses = {
  base: "z-0",
  dropdown: "z-dropdown",
  sticky: "z-sticky",
  fixed: "z-fixed",
  modalBackdrop: "z-modal-backdrop",
  modal: "z-modal",
  popover: "z-popover",
  tooltip: "z-tooltip",
  toast: "z-toast",
} as const;

/**
 * Hook to check if user prefers reduced motion
 * Note: For React components, prefer using the hook from @lib/hooks/useAnimation
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get duration that respects reduced motion preference
 */
export function getAccessibleDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Framer Motion variants for common animations
 * Use with framer-motion's `variants` prop
 */
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  slideDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
} as const;

/**
 * Framer Motion transition presets
 */
export const motionTransitions = {
  fast: { duration: durations.fast / 1000, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: durations.normal / 1000, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: durations.slow / 1000, ease: [0.4, 0, 0.2, 1] },
  bounce: { duration: durations.normal / 1000, ease: [0.68, -0.55, 0.265, 1.55] },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springBouncy: { type: "spring", stiffness: 400, damping: 25 },
} as const;
