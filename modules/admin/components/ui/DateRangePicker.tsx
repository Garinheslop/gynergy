"use client";

import { useState, useRef, useEffect, useMemo } from "react";

import { cn } from "@lib/utils/style";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    getValue: () => DateRange;
  }>;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const DEFAULT_PRESETS = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { start: yesterday, end };
    },
  },
  {
    label: "Last 7 days",
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: "Last 90 days",
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    label: "This month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: "Last month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    label: "This year",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  minDate,
  maxDate,
  disabled = false,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value.start || new Date());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  const handleDayClick = (date: Date) => {
    if (selecting === "start") {
      setTempRange({ start: date, end: null });
      setSelecting("end");
    } else {
      if (tempRange.start && date < tempRange.start) {
        setTempRange({ start: date, end: tempRange.start });
      } else {
        setTempRange({ ...tempRange, end: date });
      }
      setSelecting("start");
    }
  };

  const handleApply = () => {
    if (tempRange.start && tempRange.end) {
      onChange(tempRange);
      setIsOpen(false);
    }
  };

  const handlePreset = (preset: (typeof presets)[0]) => {
    const range = preset.getValue();
    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const isInRange = (date: Date) => {
    if (!tempRange.start || !tempRange.end) return false;
    return date >= tempRange.start && date <= tempRange.end;
  };

  const isRangeStart = (date: Date) => {
    return tempRange.start?.toDateString() === date.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    return tempRange.end?.toDateString() === date.toDateString();
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const navigateMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const displayValue =
    value.start && value.end
      ? `${formatDate(value.start)} - ${formatDate(value.end)}`
      : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "bg-grey-800 border-grey-700 hover:bg-grey-700 flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors",
          value.start ? "text-white" : "text-grey-400",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          <i className="gng-calendar text-grey-400" />
          <span>{displayValue}</span>
        </div>
        <i
          className={cn(
            "gng-chevron-down text-grey-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="bg-grey-900 border-grey-700 absolute right-0 z-50 mt-2 flex overflow-hidden rounded-xl border shadow-xl">
          {/* Presets Sidebar */}
          <div className="border-grey-700 w-40 border-r p-2">
            {presets.map((preset, i) => (
              <button
                key={i}
                onClick={() => handlePreset(preset)}
                className="text-grey-300 hover:bg-grey-800 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:text-white"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="w-72 p-4">
            {/* Month Navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 transition-colors hover:text-white"
              >
                <i className="gng-chevron-left" />
              </button>
              <span className="font-medium text-white">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 transition-colors hover:text-white"
              >
                <i className="gng-chevron-right" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="text-grey-500 text-center text-xs font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, isCurrentMonth }, i) => {
                const disabled = isDisabled(date);
                const inRange = isInRange(date);
                const isStart = isRangeStart(date);
                const isEnd = isRangeEnd(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={i}
                    onClick={() => !disabled && handleDayClick(date)}
                    disabled={disabled}
                    className={cn(
                      "h-8 w-8 rounded-lg text-sm transition-colors",
                      !isCurrentMonth && "text-grey-600",
                      isCurrentMonth && !inRange && "text-grey-300 hover:bg-grey-800",
                      inRange && !isStart && !isEnd && "bg-action-900/50 text-action-300",
                      (isStart || isEnd) && "bg-action-600 font-bold text-white",
                      isToday && !inRange && "ring-action-600 ring-1",
                      disabled && "cursor-not-allowed opacity-30"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Selected Range Display */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-grey-400">
                {tempRange.start ? formatDate(tempRange.start) : "Select start"}
              </div>
              <i className="gng-arrow-right text-grey-500" />
              <div className="text-grey-400">
                {tempRange.end ? formatDate(tempRange.end) : "Select end"}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={!tempRange.start || !tempRange.end}
              className={cn(
                "bg-action-600 mt-4 w-full rounded-lg py-2 text-sm font-medium text-white transition-colors",
                (!tempRange.start || !tempRange.end) && "cursor-not-allowed opacity-50",
                tempRange.start && tempRange.end && "hover:bg-action-700"
              )}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
