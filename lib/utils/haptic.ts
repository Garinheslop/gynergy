/**
 * Haptic feedback utility for native-like touch interactions.
 * Uses the Vibration API when available (primarily mobile devices).
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 40, 20],
  error: [30, 50, 30, 50, 30],
};

/**
 * Trigger haptic feedback with a predefined pattern.
 * Silently does nothing if the Vibration API is not supported.
 *
 * @param pattern - The haptic feedback pattern to use
 * @returns true if haptic feedback was triggered, false otherwise
 */
export function triggerHaptic(pattern: HapticPattern = "light"): boolean {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return false;
  }

  try {
    return navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    return false;
  }
}

/**
 * Trigger a custom haptic pattern.
 *
 * @param pattern - Duration in ms, or array of durations for complex patterns
 * @returns true if haptic feedback was triggered, false otherwise
 */
export function triggerCustomHaptic(pattern: number | number[]): boolean {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Cancel any ongoing haptic feedback.
 */
export function cancelHaptic(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(0);
  }
}

/**
 * Check if haptic feedback is supported on the current device.
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}
