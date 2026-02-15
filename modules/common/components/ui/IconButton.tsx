"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

import { cn } from "@lib/utils/style";

type IconButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type IconButtonVariant = "default" | "ghost" | "outline" | "danger" | "action" | "dark";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  label: string; // Required for accessibility (aria-label)
  isLoading?: boolean;
  isActive?: boolean;
}

const sizeStyles: Record<IconButtonSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-14 w-14 text-xl",
};

// Minimum touch target size for accessibility (44x44px)
const touchTargetStyles: Record<IconButtonSize, string> = {
  xs: "before:absolute before:-inset-2 before:content-['']",
  sm: "before:absolute before:-inset-1 before:content-['']",
  md: "",
  lg: "",
  xl: "",
};

const variantStyles: Record<IconButtonVariant, { base: string; hover: string; active: string }> = {
  default: {
    base: "bg-bkg-light text-content-dark border border-border-light",
    hover: "hover:bg-bkg-light-secondary",
    active: "bg-bkg-light-secondary",
  },
  ghost: {
    base: "bg-transparent text-content-dark",
    hover: "hover:bg-bkg-light-secondary",
    active: "bg-bkg-light-secondary",
  },
  outline: {
    base: "bg-transparent text-content-dark border border-border-light",
    hover: "hover:bg-bkg-light-secondary hover:border-border-light-secondary",
    active: "bg-bkg-light-secondary border-border-light-secondary",
  },
  danger: {
    base: "bg-transparent text-danger",
    hover: "hover:bg-danger/10",
    active: "bg-danger/20",
  },
  action: {
    base: "bg-action text-content-dark",
    hover: "hover:bg-action-100",
    active: "bg-action-200",
  },
  dark: {
    base: "bg-bkg-dark-secondary text-content-light border border-border-dark",
    hover: "hover:bg-bkg-dark",
    active: "bg-bkg-dark",
  },
};

/**
 * IconButton - Accessible icon-only button component
 *
 * Features:
 * - Consistent sizing across the app
 * - Multiple variants for different contexts
 * - Accessible: requires aria-label
 * - Touch-friendly: minimum 44x44px touch target
 * - Focus visible styles for keyboard navigation
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon="gng-close"
 *   label="Close dialog"
 *   onClick={onClose}
 *   variant="ghost"
 * />
 * ```
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      size = "md",
      variant = "default",
      label,
      isLoading = false,
      isActive = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantStyles[variant];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center rounded-full transition-colors",
          // Focus styles
          "focus-visible:ring-action-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Size
          sizeStyles[size],
          // Touch target for small sizes
          touchTargetStyles[size],
          // Variant base
          variantStyle.base,
          // Hover (only if not disabled)
          !disabled && !isLoading && variantStyle.hover,
          // Active state
          isActive && variantStyle.active,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <i className={cn(icon)} aria-hidden="true" />
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;

// Pre-configured variants for common use cases
export function CloseButton({
  onClose,
  size = "sm",
  variant = "ghost",
  className,
}: {
  onClose: () => void;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-x"
      label="Close"
      onClick={onClose}
      size={size}
      variant={variant}
      className={className}
    />
  );
}

export function MenuButton({
  onClick,
  isOpen,
  size = "md",
  className,
}: {
  onClick: () => void;
  isOpen?: boolean;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon={isOpen ? "gng-x" : "gng-menu"}
      label={isOpen ? "Close menu" : "Open menu"}
      onClick={onClick}
      size={size}
      variant="ghost"
      isActive={isOpen}
      className={className}
    />
  );
}

export function BackButton({
  onClick,
  size = "sm",
  className,
}: {
  onClick: () => void;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-arrow-left"
      label="Go back"
      onClick={onClick}
      size={size}
      variant="ghost"
      className={className}
    />
  );
}

export function SettingsButton({
  onClick,
  size = "md",
  className,
}: {
  onClick: () => void;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-settings"
      label="Settings"
      onClick={onClick}
      size={size}
      variant="ghost"
      className={className}
    />
  );
}

export function MoreButton({
  onClick,
  size = "sm",
  className,
}: {
  onClick: () => void;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-more-vertical"
      label="More options"
      onClick={onClick}
      size={size}
      variant="ghost"
      className={className}
    />
  );
}

export function RefreshButton({
  onClick,
  isLoading,
  size = "sm",
  className,
}: {
  onClick: () => void;
  isLoading?: boolean;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-refresh-cw"
      label="Refresh"
      onClick={onClick}
      size={size}
      variant="ghost"
      isLoading={isLoading}
      className={className}
    />
  );
}

export function DeleteButton({
  onClick,
  size = "sm",
  className,
}: {
  onClick: () => void;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-trash-2"
      label="Delete"
      onClick={onClick}
      size={size}
      variant="danger"
      className={className}
    />
  );
}

export function EditButton({
  onClick,
  size = "sm",
  className,
}: {
  onClick: () => void;
  size?: IconButtonSize;
  className?: string;
}) {
  return (
    <IconButton
      icon="gng-edit"
      label="Edit"
      onClick={onClick}
      size={size}
      variant="ghost"
      className={className}
    />
  );
}
