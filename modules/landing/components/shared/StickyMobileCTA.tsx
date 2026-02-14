"use client";

import { cn } from "@lib/utils/style";

import { useStickyVisibility } from "../../hooks/useStickyVisibility";

interface StickyMobileCTAProps {
  ctaText: string;
  price: string;
  onCtaClick: () => void;
  isLoading?: boolean;
}

export default function StickyMobileCTA({
  ctaText,
  price,
  onCtaClick,
  isLoading = false,
}: StickyMobileCTAProps) {
  const isVisible = useStickyVisibility({ threshold: 0.8 });

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50",
        "md:hidden", // Only show on mobile
        "px-4 py-3",
        "bg-lp-black/95 backdrop-blur-xl",
        "border-lp-gold-dim border-t",
        "flex items-center justify-between gap-4",
        "transform transition-transform duration-400",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Price Info */}
      <div className="flex flex-col">
        <span className="font-bebas text-lp-gold-light text-2xl leading-none">{price}</span>
        <span className="font-oswald text-lp-muted text-[10px] font-light tracking-wider uppercase">
          One-time
        </span>
      </div>

      {/* CTA Button */}
      <button
        onClick={onCtaClick}
        disabled={isLoading}
        className={cn(
          "max-w-[200px] flex-1",
          "font-oswald text-xs font-medium tracking-wider uppercase",
          "px-4 py-3",
          "bg-lp-gold text-lp-black",
          "transition-all duration-300",
          "hover:bg-lp-gold-light",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:ring-lp-gold-light focus-visible:ring-offset-lp-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        )}
      >
        {isLoading ? "..." : ctaText}
      </button>
    </div>
  );
}
