"use client";

import { cn } from "@lib/utils/style";

interface CTAButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "default" | "large" | "small";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  arrowIcon?: boolean;
}

export default function CTAButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  isLoading = false,
  disabled = false,
  className,
  arrowIcon = true,
}: CTAButtonProps) {
  const variantStyles = {
    primary: cn(
      "bg-lp-gold-light text-lp-black",
      "hover:bg-[#E0BE5A] hover:-translate-y-0.5",
      "hover:shadow-[0_8px_40px_rgba(184,148,62,0.3)]"
    ),
    secondary: cn(
      "bg-transparent text-lp-gold-light",
      "border-2 border-lp-gold",
      "hover:bg-lp-gold-dim"
    ),
    outline: cn(
      "bg-transparent text-lp-white",
      "border border-lp-border",
      "hover:border-lp-gold hover:text-lp-gold"
    ),
  };

  const sizeStyles = {
    small: "px-4 py-2 text-xs",
    default: "px-7 py-3 text-sm",
    large: "px-10 py-4 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center gap-3",
        "font-oswald font-medium tracking-widest uppercase",
        "cursor-pointer border-none",
        "transition-all duration-400",
        "overflow-hidden",
        variantStyles[variant],
        sizeStyles[size],
        "disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:ring-lp-gold focus-visible:ring-offset-lp-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Shimmer effect overlay */}
      <span
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-transparent via-white/20 to-transparent",
          "translate-x-[-100%]",
          "transition-transform duration-600",
          "group-hover:translate-x-[100%]"
        )}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            {children}
            {arrowIcon && <span aria-hidden="true">→</span>}
          </>
        )}
      </span>
    </button>
  );
}
