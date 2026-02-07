"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to animate mounting/unmounting
 */
export function useAnimationState(
  isOpen: boolean,
  duration = 200
): {
  shouldRender: boolean;
  isAnimating: boolean;
  isEntering: boolean;
  isLeaving: boolean;
} {
  const [state, setState] = useState({
    shouldRender: isOpen,
    isAnimating: false,
    isEntering: false,
    isLeaving: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Opening
      setState({
        shouldRender: true,
        isAnimating: true,
        isEntering: true,
        isLeaving: false,
      });

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // End animation
      timeoutRef.current = setTimeout(() => {
        setState({
          shouldRender: true,
          isAnimating: false,
          isEntering: false,
          isLeaving: false,
        });
      }, duration);
    } else {
      // Closing
      setState((prev) => ({
        ...prev,
        isAnimating: true,
        isEntering: false,
        isLeaving: true,
      }));

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Unmount after animation
      timeoutRef.current = setTimeout(() => {
        setState({
          shouldRender: false,
          isAnimating: false,
          isEntering: false,
          isLeaving: false,
        });
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, duration]);

  return state;
}

/**
 * Hook for spring-like animations using requestAnimationFrame
 */
interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
}

export function useSpring(targetValue: number, config: SpringConfig = {}): number {
  const { stiffness = 170, damping = 26, mass = 1, precision = 0.01 } = config;

  const [currentValue, setCurrentValue] = useState(targetValue);
  const velocityRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.064);
      lastTimeRef.current = time;

      setCurrentValue((current) => {
        const displacement = targetValue - current;
        const springForce = stiffness * displacement;
        const dampingForce = damping * velocityRef.current;
        const acceleration = (springForce - dampingForce) / mass;

        velocityRef.current += acceleration * deltaTime;
        const newValue = current + velocityRef.current * deltaTime;

        // Check if animation is complete
        if (Math.abs(displacement) < precision && Math.abs(velocityRef.current) < precision) {
          velocityRef.current = 0;
          return targetValue;
        }

        frameRef.current = requestAnimationFrame(animate);
        return newValue;
      });
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [targetValue, stiffness, damping, mass, precision]);

  return currentValue;
}

/**
 * Hook for counting animation
 */
export function useCountUp(
  end: number,
  options: {
    start?: number;
    duration?: number;
    delay?: number;
    easing?: (t: number) => number;
    onComplete?: () => void;
  } = {}
): number {
  const { start = 0, duration = 1000, delay = 0, easing = (t) => t, onComplete } = options;

  const [count, setCount] = useState(start);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const animate = (currentTime: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        const currentCount = start + (end - start) * easedProgress;

        setCount(currentCount);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [end, start, duration, delay, easing, onComplete]);

  return count;
}

/**
 * Hook for typewriter effect
 */
export function useTypewriter(
  text: string,
  options: {
    speed?: number;
    delay?: number;
    loop?: boolean;
    onComplete?: () => void;
  } = {}
): { displayText: string; isTyping: boolean; reset: () => void } {
  const { speed = 50, delay = 0, loop = false, onComplete } = options;

  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    indexRef.current = 0;
    setDisplayText("");
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    reset();

    const startTyping = () => {
      setIsTyping(true);

      const type = () => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          onComplete?.();

          if (loop) {
            timeoutRef.current = setTimeout(() => {
              reset();
              startTyping();
            }, 1000);
          }
        }
      };

      type();
    };

    timeoutRef.current = setTimeout(startTyping, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, loop, onComplete, reset]);

  return { displayText, isTyping, reset };
}

/**
 * Hook for intersection-based animations
 */
export function useInView(options: IntersectionObserverInit = {}): {
  ref: React.RefObject<HTMLElement>;
  isInView: boolean;
  hasBeenInView: boolean;
} {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasBeenInView(true);
      }
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref, isInView, hasBeenInView };
}

/**
 * Common easing functions
 */
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

/**
 * Hook for staggered animations
 */
export function useStaggeredAnimation<T>(
  items: T[],
  options: {
    staggerDelay?: number;
    initialDelay?: number;
  } = {}
): { visibleItems: T[]; isComplete: boolean } {
  const { staggerDelay = 100, initialDelay = 0 } = options;
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);

    const timeouts: NodeJS.Timeout[] = [];

    items.forEach((_, index) => {
      const timeout = setTimeout(
        () => {
          setVisibleCount((prev) => prev + 1);
        },
        initialDelay + index * staggerDelay
      );
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [items, staggerDelay, initialDelay]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return {
    visibleItems,
    isComplete: visibleCount >= items.length,
  };
}
