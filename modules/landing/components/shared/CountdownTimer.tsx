"use client";

import { cn } from "@lib/utils/style";

import { useCountdown } from "../../hooks/useCountdown";

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

interface TimeBoxProps {
  value: number;
  label: string;
  compact?: boolean;
}

function TimeBox({ value, label, compact }: TimeBoxProps) {
  return (
    <div
      className={cn(
        "border-lp-gold-dim bg-lp-gold-glow flex flex-col items-center border",
        compact ? "px-3 py-2" : "px-4 py-3 md:px-6 md:py-4"
      )}
    >
      <span
        className={cn(
          "font-bebas text-lp-gold-light leading-none",
          compact ? "text-xl" : "text-2xl md:text-4xl"
        )}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        className={cn(
          "font-oswald text-lp-muted mt-1 font-light tracking-widest uppercase",
          compact ? "text-[8px]" : "text-[10px] md:text-xs"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({
  targetDate,
  onExpire,
  className,
  compact = false,
}: CountdownTimerProps) {
  const timeLeft = useCountdown(targetDate, { onExpire });

  if (timeLeft.isExpired) {
    return (
      <div
        className={cn(
          "font-oswald text-lp-gold-light tracking-wider uppercase",
          compact ? "text-sm" : "text-base md:text-lg",
          className
        )}
      >
        Challenge Has Started
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "gap-2" : "gap-3 md:gap-4",
        className
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">
        {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes, {timeLeft.seconds}{" "}
        seconds remaining
      </span>
      <TimeBox value={timeLeft.days} label="Days" compact={compact} />
      <TimeBox value={timeLeft.hours} label="Hours" compact={compact} />
      <TimeBox value={timeLeft.minutes} label="Minutes" compact={compact} />
      {!compact && <TimeBox value={timeLeft.seconds} label="Seconds" compact={compact} />}
    </div>
  );
}
