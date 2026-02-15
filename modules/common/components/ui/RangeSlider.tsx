"use client";

import { useRef, useCallback, useState, KeyboardEvent, PointerEvent } from "react";

import { cn } from "@lib/utils/style";

// Types
type SliderSize = "sm" | "md" | "lg";

interface RangeSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
  size?: SliderSize;
  showValue?: boolean;
  showMinMax?: boolean;
  formatValue?: (value: number) => string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

// Dual thumb range slider
interface DualRangeSliderProps {
  value?: [number, number];
  defaultValue?: [number, number];
  min?: number;
  max?: number;
  step?: number;
  minDistance?: number;
  onChange?: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
  disabled?: boolean;
  size?: SliderSize;
  showValues?: boolean;
  showMinMax?: boolean;
  formatValue?: (value: number) => string;
  "aria-label"?: string;
  className?: string;
}

const sizeStyles: Record<SliderSize, { track: string; thumb: string; value: string }> = {
  sm: {
    track: "h-1",
    thumb: "h-4 w-4",
    value: "text-xs",
  },
  md: {
    track: "h-1.5",
    thumb: "h-5 w-5",
    value: "text-sm",
  },
  lg: {
    track: "h-2",
    thumb: "h-6 w-6",
    value: "text-base",
  },
};

// Utility to clamp value within range
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Utility to snap to step
function snapToStep(value: number, min: number, step: number): number {
  return Math.round((value - min) / step) * step + min;
}

export function RangeSlider({
  value: controlledValue,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onChangeEnd,
  disabled = false,
  size = "md",
  showValue = false,
  showMinMax = false,
  formatValue = (v) => String(v),
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  className,
}: RangeSliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (newValue: number, commit = false) => {
      const clampedValue = clamp(snapToStep(newValue, min, step), min, max);
      if (controlledValue === undefined) {
        setInternalValue(clampedValue);
      }
      onChange?.(clampedValue);
      if (commit) {
        onChangeEnd?.(clampedValue);
      }
    },
    [controlledValue, min, max, step, onChange, onChangeEnd]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + percent * (max - min);
    },
    [min, max, value]
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    updateValue(getValueFromPosition(e.clientX));
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    updateValue(getValueFromPosition(e.clientX));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
    onChangeEnd?.(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    let newValue = value;
    const largeStep = step * 10;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = value + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = value - step;
        break;
      case "PageUp":
        e.preventDefault();
        newValue = value + largeStep;
        break;
      case "PageDown":
        e.preventDefault();
        newValue = value - largeStep;
        break;
      case "Home":
        e.preventDefault();
        newValue = min;
        break;
      case "End":
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }

    updateValue(newValue, true);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Min/Max labels */}
      {showMinMax && (
        <div className={cn("text-grey-400 mb-1 flex justify-between", sizeStyles[size].value)}>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}

      {/* Slider track */}
      <div
        ref={trackRef}
        className={cn(
          "bg-grey-700 relative w-full cursor-pointer rounded-full",
          sizeStyles[size].track,
          disabled && "cursor-not-allowed opacity-50"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Filled track */}
        <div
          className="bg-action-500 absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform",
            "focus-visible:ring-action-500 focus-visible:ring-offset-grey-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "hover:scale-110",
            isDragging && "scale-110",
            sizeStyles[size].thumb
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Current value display */}
      {showValue && (
        <div className={cn("text-grey-300 mt-1 text-center", sizeStyles[size].value)}>
          {formatValue(value)}
        </div>
      )}
    </div>
  );
}

export function DualRangeSlider({
  value: controlledValue,
  defaultValue = [25, 75],
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  onChange,
  onChangeEnd,
  disabled = false,
  size = "md",
  showValues = false,
  showMinMax = false,
  formatValue = (v) => String(v),
  "aria-label": ariaLabel,
  className,
}: DualRangeSliderProps) {
  const [internalValue, setInternalValue] = useState<[number, number]>(defaultValue);
  const [activeThumb, setActiveThumb] = useState<0 | 1 | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const [lowValue, highValue] = value;
  const lowPercentage = ((lowValue - min) / (max - min)) * 100;
  const highPercentage = ((highValue - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (thumb: 0 | 1, newValue: number, commit = false) => {
      const clampedValue = clamp(snapToStep(newValue, min, step), min, max);
      let newRange: [number, number];

      if (thumb === 0) {
        const maxAllowed = highValue - minDistance;
        newRange = [Math.min(clampedValue, maxAllowed), highValue];
      } else {
        const minAllowed = lowValue + minDistance;
        newRange = [lowValue, Math.max(clampedValue, minAllowed)];
      }

      if (controlledValue === undefined) {
        setInternalValue(newRange);
      }
      onChange?.(newRange);
      if (commit) {
        onChangeEnd?.(newRange);
      }
    },
    [controlledValue, min, max, step, minDistance, lowValue, highValue, onChange, onChangeEnd]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return lowValue;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + percent * (max - min);
    },
    [min, max, lowValue]
  );

  const handleTrackClick = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const clickValue = getValueFromPosition(e.clientX);
    // Determine which thumb is closer
    const distToLow = Math.abs(clickValue - lowValue);
    const distToHigh = Math.abs(clickValue - highValue);
    const thumb = distToLow < distToHigh ? 0 : 1;
    updateValue(thumb, clickValue, true);
  };

  const createThumbHandlers = (thumb: 0 | 1) => ({
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setActiveThumb(thumb);
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (activeThumb !== thumb || disabled) return;
      updateValue(thumb, getValueFromPosition(e.clientX));
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (activeThumb !== thumb) return;
      setActiveThumb(null);
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      onChangeEnd?.(value);
    },
  });

  const handleKeyDown = (thumb: 0 | 1) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const currentValue = thumb === 0 ? lowValue : highValue;
    let newValue = currentValue;
    const largeStep = step * 10;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = currentValue + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = currentValue - step;
        break;
      case "PageUp":
        e.preventDefault();
        newValue = currentValue + largeStep;
        break;
      case "PageDown":
        e.preventDefault();
        newValue = currentValue - largeStep;
        break;
      case "Home":
        e.preventDefault();
        newValue = min;
        break;
      case "End":
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }

    updateValue(thumb, newValue, true);
  };

  return (
    <div className={cn("w-full", className)}>
      {showMinMax && (
        <div className={cn("text-grey-400 mb-1 flex justify-between", sizeStyles[size].value)}>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}

      <div
        ref={trackRef}
        className={cn(
          "bg-grey-700 relative w-full cursor-pointer rounded-full",
          sizeStyles[size].track,
          disabled && "cursor-not-allowed opacity-50"
        )}
        onPointerDown={handleTrackClick}
      >
        {/* Filled track */}
        <div
          className="bg-action-500 absolute top-0 h-full rounded-full"
          style={{
            left: `${lowPercentage}%`,
            width: `${highPercentage - lowPercentage}%`,
          }}
        />

        {/* Low thumb */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={highValue - minDistance}
          aria-valuenow={lowValue}
          aria-valuetext={formatValue(lowValue)}
          aria-label={ariaLabel ? `${ariaLabel} minimum` : "Minimum value"}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown(0)}
          {...createThumbHandlers(0)}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform",
            "focus-visible:ring-action-500 focus-visible:ring-offset-grey-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "z-10 hover:scale-110",
            activeThumb === 0 && "scale-110",
            sizeStyles[size].thumb
          )}
          style={{ left: `${lowPercentage}%` }}
        />

        {/* High thumb */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={lowValue + minDistance}
          aria-valuemax={max}
          aria-valuenow={highValue}
          aria-valuetext={formatValue(highValue)}
          aria-label={ariaLabel ? `${ariaLabel} maximum` : "Maximum value"}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown(1)}
          {...createThumbHandlers(1)}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform",
            "focus-visible:ring-action-500 focus-visible:ring-offset-grey-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "z-10 hover:scale-110",
            activeThumb === 1 && "scale-110",
            sizeStyles[size].thumb
          )}
          style={{ left: `${highPercentage}%` }}
        />
      </div>

      {showValues && (
        <div className={cn("text-grey-300 mt-1 flex justify-between", sizeStyles[size].value)}>
          <span>{formatValue(lowValue)}</span>
          <span>{formatValue(highValue)}</span>
        </div>
      )}
    </div>
  );
}
