"use client";

import { cn } from "@lib/utils/style";

interface SectionTitleProps {
  children: React.ReactNode;
  highlight?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionTitle({
  children,
  highlight,
  centered = false,
  className,
}: SectionTitleProps) {
  // If highlight is provided, we expect children to be a string with {highlight} placeholder
  const renderContent = () => {
    if (!highlight || typeof children !== "string") {
      return children;
    }

    const parts = children.split("{highlight}");
    return (
      <>
        {parts[0]}
        <span className="text-lp-gold-light">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <h2
      className={cn(
        "font-bebas text-lp-white mb-6 leading-[0.95] tracking-wide",
        "text-[clamp(2.4rem,5.5vw,4.2rem)]",
        centered && "text-center",
        className
      )}
    >
      {renderContent()}
    </h2>
  );
}
