"use client";

import { cn } from "@lib/utils/style";

import Spinner from "../Spinner";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "skeleton" | "dots" | "pulse";
  className?: string;
  inline?: boolean;
}

const sizeStyles = {
  sm: {
    container: "py-4",
    spinner: "h-5 w-5",
    text: "text-xs",
    skeleton: "h-16",
  },
  md: {
    container: "py-8",
    spinner: "h-8 w-8",
    text: "text-sm",
    skeleton: "h-32",
  },
  lg: {
    container: "py-12",
    spinner: "h-12 w-12",
    text: "text-base",
    skeleton: "h-48",
  },
};

export function LoadingState({
  message,
  size = "md",
  variant = "spinner",
  className,
  inline = false,
}: LoadingStateProps) {
  const styles = sizeStyles[size];

  if (variant === "skeleton") {
    return (
      <div className={cn("animate-pulse space-y-4", styles.container, className)}>
        <div className={cn("bg-bkg-light-secondary rounded", styles.skeleton)} />
        {message && (
          <p className={cn("text-content-dark-secondary text-center", styles.text)}>{message}</p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-1",
          !inline && styles.container,
          className
        )}
      >
        <div
          className="bg-action-400 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="bg-action-400 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="bg-action-400 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: "300ms" }}
        />
        {message && (
          <span className={cn("text-content-dark-secondary ml-2", styles.text)}>{message}</span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center", styles.container, className)}>
        <div className={cn("bg-action-200 animate-pulse rounded-full", styles.spinner)} />
        {message && (
          <p className={cn("text-content-dark-secondary mt-3", styles.text)}>{message}</p>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        !inline && "flex-col",
        !inline && styles.container,
        className
      )}
    >
      <Spinner sx={styles.spinner} />
      {message && (
        <p className={cn("text-content-dark-secondary", inline ? "ml-2" : "mt-3", styles.text)}>
          {message}
        </p>
      )}
    </div>
  );
}

// Skeleton variants for specific content types
export function CardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-bkg-light rounded-large animate-pulse p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="bg-bkg-light-secondary h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-bkg-light-secondary h-4 w-1/3 rounded" />
              <div className="bg-bkg-light-secondary h-3 w-1/4 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-bkg-light-secondary h-4 w-full rounded" />
            <div className="bg-bkg-light-secondary h-4 w-5/6 rounded" />
            <div className="bg-bkg-light-secondary h-4 w-4/6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4">
          <div className="bg-bkg-light-secondary h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-bkg-light-secondary h-4 w-2/3 rounded" />
            <div className="bg-bkg-light-secondary h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-bkg-light-secondary h-4 animate-pulse rounded",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-bkg-light-secondary rounded-large flex animate-pulse items-center justify-center",
        className
      )}
    >
      <i className="gng-image text-bkg-disabled text-4xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-bkg-light-secondary h-4 flex-1 animate-pulse rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="bg-bkg-light-secondary/60 h-8 flex-1 animate-pulse rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingState;
