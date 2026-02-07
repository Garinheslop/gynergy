"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { cn } from "@lib/utils/style";

// Context for dropdown state
interface DropdownContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  registerItem: (index: number) => void;
  itemCount: number;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown");
  }
  return context;
}

// Main Dropdown container
interface DropdownProps {
  children: ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [itemCount, setItemCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setActiveIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const registerItem = useCallback(() => {
    setItemCount((prev) => prev + 1);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        toggle,
        close,
        activeIndex,
        setActiveIndex,
        registerItem,
        itemCount,
      }}
    >
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown trigger button
interface DropdownTriggerProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export function DropdownTrigger({ children, className, asChild }: DropdownTriggerProps) {
  const { isOpen, toggle, setActiveIndex, itemCount } = useDropdownContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            toggle();
          }
          setActiveIndex(0);
          break;
        case "ArrowUp":
          event.preventDefault();
          if (!isOpen) {
            toggle();
          }
          setActiveIndex(itemCount - 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          toggle();
          break;
      }
    },
    [isOpen, toggle, setActiveIndex, itemCount]
  );

  if (asChild) {
    return <>{children}</>;
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      onKeyDown={handleKeyDown}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2",
        "bg-grey-800 hover:bg-grey-700 text-white",
        "border-grey-700 border",
        "transition-colors",
        "focus:ring-action-500 focus:ring-offset-grey-900 focus:ring-2 focus:ring-offset-2 focus:outline-none",
        className
      )}
    >
      {children}
      <i className={cn("gng-chevron-down text-xs transition-transform", isOpen && "rotate-180")} />
    </button>
  );
}

// Dropdown menu content
interface DropdownMenuProps {
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "bottom" | "top";
  className?: string;
}

export function DropdownMenu({
  children,
  align = "start",
  side = "bottom",
  className,
}: DropdownMenuProps) {
  const { isOpen, activeIndex, setActiveIndex, close, itemCount } = useDropdownContext();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((activeIndex + 1) % itemCount);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((activeIndex - 1 + itemCount) % itemCount);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(itemCount - 1);
          break;
        case "Tab":
          close();
          break;
      }
    },
    [activeIndex, setActiveIndex, itemCount, close]
  );

  // Focus management
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[role="menuitem"]');
      if (activeIndex >= 0 && items[activeIndex]) {
        (items[activeIndex] as HTMLElement).focus();
      }
    }
  }, [isOpen, activeIndex]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  const sideClasses = {
    bottom: "top-full mt-1",
    top: "bottom-full mb-1",
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-50 min-w-[160px]",
        alignmentClasses[align],
        sideClasses[side],
        "border-grey-700 bg-grey-800 rounded-lg border py-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}

// Individual menu item
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: string;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  className,
}: DropdownItemProps) {
  const { close, registerItem } = useDropdownContext();
  const itemRef = useRef<HTMLButtonElement>(null);

  // Register item on mount
  useEffect(() => {
    registerItem(0);
  }, [registerItem]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    close();
  }, [disabled, onClick, close]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      ref={itemRef}
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
        "transition-colors",
        disabled
          ? "text-grey-500 cursor-not-allowed"
          : destructive
            ? "text-danger hover:bg-danger/10"
            : "text-grey-200 hover:bg-grey-700 hover:text-white",
        "focus:bg-grey-700 focus:text-white focus:outline-none",
        className
      )}
    >
      {icon && <i className={cn(icon, "text-base")} />}
      {children}
    </button>
  );
}

// Separator between menu items
export function DropdownSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn("bg-grey-700 my-1 h-px", className)} />;
}

// Label/header for menu sections
interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div className={cn("text-grey-400 px-3 py-1.5 text-xs font-medium", className)}>{children}</div>
  );
}

// Checkbox item
interface DropdownCheckboxItemProps {
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownCheckboxItem({
  children,
  checked,
  onChange,
  disabled = false,
  className,
}: DropdownCheckboxItemProps) {
  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange(!checked);
  }, [disabled, checked, onChange]);

  return (
    <button
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
        "transition-colors",
        disabled
          ? "text-grey-500 cursor-not-allowed"
          : "text-grey-200 hover:bg-grey-700 hover:text-white",
        "focus:bg-grey-700 focus:text-white focus:outline-none",
        className
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border",
          checked ? "border-action-500 bg-action-500 text-white" : "border-grey-600"
        )}
      >
        {checked && <i className="gng-check text-xs" />}
      </span>
      {children}
    </button>
  );
}
