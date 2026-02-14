"use client";

import { cn } from "@lib/utils/style";

interface SectionLabelProps {
  children: React.ReactNode;
  centered?: boolean;
  className?: string;
}

export default function SectionLabel({ children, centered = false, className }: SectionLabelProps) {
  return (
    <div className={cn("mb-8 flex items-center gap-4", centered && "justify-center", className)}>
      <span className={cn("bg-lp-gold h-px w-10", centered && "hidden")} />
      <span className="font-oswald text-lp-gold text-xs font-light tracking-[0.35em] uppercase">
        {children}
      </span>
    </div>
  );
}
