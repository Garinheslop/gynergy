"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from "react";

import { cn } from "@lib/utils/style";

type TooltipSide = "top" | "right" | "bottom" | "left";
type TooltipAlign = "start" | "center" | "end";

interface TooltipProps {
  /** Content to display in the tooltip */
  content: ReactNode;
  /** The trigger element */
  children: ReactElement;
  /** Which side to show the tooltip */
  side?: TooltipSide;
  /** Alignment of tooltip relative to trigger */
  align?: TooltipAlign;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Delay before hiding (ms) */
  delayHide?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional class name for the tooltip */
  className?: string;
  /** Whether to show arrow */
  showArrow?: boolean;
}

/**
 * Accessible tooltip component
 *
 * @example
 * ```tsx
 * <Tooltip content="This is helpful information">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * <Tooltip content="Action description" side="right">
 *   <IconButton icon="settings" />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayShow = 200,
  delayHide = 0,
  disabled = false,
  className,
  showArrow = true,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2)}`);

  // Clear any pending timeouts
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    if (disabled) return;

    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayShow);
  }, [disabled, delayShow, clearTimeouts]);

  const hide = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, delayHide);
  }, [delayHide, clearTimeouts]);

  // Handle keyboard events on trigger
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Position classes
  const positionClasses: Record<TooltipSide, string> = {
    top: "bottom-full mb-2",
    right: "left-full ml-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
  };

  const alignClasses: Record<TooltipSide, Record<TooltipAlign, string>> = {
    top: {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    },
    bottom: {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    },
    left: {
      start: "top-0",
      center: "top-1/2 -translate-y-1/2",
      end: "bottom-0",
    },
    right: {
      start: "top-0",
      center: "top-1/2 -translate-y-1/2",
      end: "bottom-0",
    },
  };

  const arrowClasses: Record<TooltipSide, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-grey-800 border-x-transparent border-b-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-grey-800 border-y-transparent border-l-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-grey-800 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-grey-800 border-y-transparent border-r-transparent",
  };

  // Clone children with event handlers
  const trigger = isValidElement(children)
    ? cloneElement(
        children as ReactElement<Record<string, unknown>>,
        {
          ref: triggerRef,
          onMouseEnter: (e: React.MouseEvent) => {
            show();
            const originalHandler = (children.props as Record<string, unknown>).onMouseEnter;
            if (typeof originalHandler === "function") {
              originalHandler(e);
            }
          },
          onMouseLeave: (e: React.MouseEvent) => {
            hide();
            const originalHandler = (children.props as Record<string, unknown>).onMouseLeave;
            if (typeof originalHandler === "function") {
              originalHandler(e);
            }
          },
          onFocus: (e: React.FocusEvent) => {
            show();
            const originalHandler = (children.props as Record<string, unknown>).onFocus;
            if (typeof originalHandler === "function") {
              originalHandler(e);
            }
          },
          onBlur: (e: React.FocusEvent) => {
            hide();
            const originalHandler = (children.props as Record<string, unknown>).onBlur;
            if (typeof originalHandler === "function") {
              originalHandler(e);
            }
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            handleKeyDown(e);
            const originalHandler = (children.props as Record<string, unknown>).onKeyDown;
            if (typeof originalHandler === "function") {
              originalHandler(e);
            }
          },
          "aria-describedby": isOpen ? tooltipId.current : undefined,
        } as Record<string, unknown>
      )
    : children;

  return (
    <span className="relative inline-flex">
      {trigger}

      {isOpen && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap",
            positionClasses[side],
            alignClasses[side][align],
            "bg-grey-800 rounded-lg px-3 py-1.5",
            "text-sm text-white",
            "border-grey-700 border shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            className
          )}
        >
          {content}

          {/* Arrow */}
          {showArrow && <span className={cn("absolute h-0 w-0 border-4", arrowClasses[side])} />}
        </div>
      )}
    </span>
  );
}

/**
 * Simple tooltip for icon buttons
 */
interface IconTooltipProps {
  label: string;
  children: ReactElement;
  side?: TooltipSide;
}

export function IconTooltip({ label, children, side = "top" }: IconTooltipProps) {
  return (
    <Tooltip content={label} side={side} delayShow={400}>
      {children}
    </Tooltip>
  );
}

/**
 * Info tooltip with icon trigger
 */
interface InfoTooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  className?: string;
}

export function InfoTooltip({ content, side = "top", className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} side={side}>
      <button
        type="button"
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center",
          "bg-grey-700 text-grey-400 rounded-full",
          "hover:bg-grey-600 hover:text-grey-300",
          "focus:ring-action-500 focus:ring-2 focus:outline-none",
          "transition-colors",
          className
        )}
        aria-label="More information"
      >
        <i className="gng-info text-xs" />
      </button>
    </Tooltip>
  );
}
