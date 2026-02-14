"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import { cn } from "@lib/utils/style";

interface LandingNavProps {
  seatsRemaining?: number;
  onEnrollClick: () => void;
  isLoading?: boolean;
}

export default function LandingNav({
  seatsRemaining = 7,
  onEnrollClick,
  isLoading = false,
}: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50",
        "flex items-center justify-between",
        "px-4 py-4 md:px-8",
        "transition-all duration-300",
        scrolled ? "bg-lp-black/90 border-lp-gold-glow border-b backdrop-blur-xl" : "bg-transparent"
      )}
    >
      {/* Brand */}
      <a href="#" className="text-lp-gold flex flex-col items-center leading-none no-underline">
        <span className="font-oswald text-sm tracking-[0.4em] uppercase">GYNERGY</span>
        <span className="font-oswald text-lp-gold/40 mt-0.5 text-lg font-light">∞</span>
      </a>

      {/* Right Side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Seats Remaining - Hidden on mobile */}
        {seatsRemaining > 0 && seatsRemaining <= 10 && (
          <span className="font-oswald text-lp-gold hidden text-xs tracking-wider uppercase md:block">
            {seatsRemaining} Seats Left
          </span>
        )}

        {/* Sign In Link for returning users - visible on all screen sizes */}
        <Link
          href="/login"
          className={cn(
            "font-oswald text-[10px] tracking-widest uppercase sm:text-xs",
            "text-lp-gold/80 hover:text-lp-gold",
            "transition-colors duration-300"
          )}
        >
          Sign In
        </Link>

        {/* CTA Button */}
        <button
          onClick={onEnrollClick}
          disabled={isLoading}
          className={cn(
            "font-oswald text-xs font-medium tracking-widest uppercase",
            "px-4 py-2.5 md:px-6 md:py-3",
            "bg-lp-gold text-lp-black",
            "transition-all duration-300",
            "hover:bg-lp-gold-light",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {isLoading ? "Loading..." : "Enroll Now"}
        </button>
      </div>
    </nav>
  );
}
