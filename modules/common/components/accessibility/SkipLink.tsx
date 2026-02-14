"use client";

import { cn } from "@lib/utils/style";

interface SkipLinkProps {
  /** ID of the main content element to skip to */
  targetId?: string;
  /** Custom label text */
  label?: string;
  className?: string;
}

/**
 * Skip-to-content link for keyboard accessibility
 * Allows keyboard users to skip repetitive navigation
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <SkipLink targetId="main-content" />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLink({
  targetId = "main-content",
  label = "Skip to main content",
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus();
      target.removeAttribute("tabindex");
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Hidden by default, visible on focus
        "sr-only focus:not-sr-only",
        // Positioning when visible
        "focus:z-fixed focus:fixed focus:top-4 focus:left-4",
        // Styling
        "focus:bg-action-600 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white",
        "focus:ring-action-400 focus:ring-offset-grey-900 focus:ring-2 focus:ring-offset-2 focus:outline-none",
        "focus:text-sm focus:font-medium",
        className
      )}
    >
      {label}
    </a>
  );
}

/**
 * Multiple skip links for complex layouts
 */
interface SkipLinksProps {
  links: Array<{
    targetId: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      <nav aria-label="Skip links" className="z-fixed fixed top-4 left-4 flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.targetId}
            href={`#${link.targetId}`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(link.targetId);
              if (target) {
                target.setAttribute("tabindex", "-1");
                target.focus();
                target.removeAttribute("tabindex");
              }
            }}
            className={cn(
              "bg-action-600 rounded-lg px-4 py-2 text-white",
              "text-sm font-medium",
              "ring-action-400 ring-offset-grey-900 ring-2 ring-offset-2 outline-none"
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
