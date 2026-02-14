"use client";

import { useInView, usePrefersReducedMotion } from "@lib/hooks/useAnimation";
import { cn } from "@lib/utils/style";

interface SectionWrapperProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  animate?: boolean;
  delay?: number;
  variant?: "default" | "dark" | "card";
  style?: React.CSSProperties;
}

export default function SectionWrapper({
  id,
  className,
  children,
  animate = true,
  delay = 0,
  variant = "default",
  style,
}: SectionWrapperProps) {
  const { ref, hasBeenInView } = useInView({ threshold: 0.1 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const shouldAnimate = animate && !prefersReducedMotion;

  const variantStyles = {
    default: "bg-lp-dark",
    dark: "bg-lp-black",
    card: "bg-lp-card",
  };

  return (
    <section
      id={id}
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        "relative px-6 py-16 md:py-24 lg:py-28",
        variantStyles[variant],
        shouldAnimate && "transition-all duration-700 ease-out",
        shouldAnimate && (hasBeenInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"),
        className
      )}
      style={{
        transitionDelay: shouldAnimate ? `${delay}ms` : undefined,
        ...style,
      }}
    >
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}
