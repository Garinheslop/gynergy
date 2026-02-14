"use client";

import { cn } from "@lib/utils/style";

interface GoldLineProps {
  variant?: "left" | "center" | "right";
  className?: string;
}

export default function GoldLine({ variant = "left", className }: GoldLineProps) {
  const variantStyles = {
    left: "bg-gradient-to-r from-lp-gold to-transparent",
    center: "bg-gradient-to-r from-transparent via-lp-gold to-transparent mx-auto",
    right: "bg-gradient-to-l from-lp-gold to-transparent ml-auto",
  };

  return <div className={cn("my-8 h-px w-20", variantStyles[variant], className)} />;
}
