"use client";

import { FC, useState, useRef, useEffect } from "react";

import {
  generateGoogleCalendarUrl,
  downloadICSFile,
  CalendarEventParams,
} from "@lib/utils/calendar";
import { cn } from "@lib/utils/style";

interface CalendarDropdownProps {
  event: CalendarEventParams;
  className?: string;
}

const CalendarDropdown: FC<CalendarDropdownProps> = ({ event, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleICSDownload = () => {
    downloadICSFile(event);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Add to calendar"
        className="text-grey-400 hover:text-action focus-visible:ring-action flex min-h-[36px] items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>Add to Calendar</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="bg-bkg-dark-secondary border-border-dark absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-lg border shadow-xl"
        >
          <button
            role="menuitem"
            onClick={handleGoogleCalendar}
            className="text-content-light hover:bg-bkg-dark flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-sm transition-colors"
          >
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8h15v11.5z" />
            </svg>
            Google Calendar
          </button>
          <button
            role="menuitem"
            onClick={handleICSDownload}
            className="text-content-light hover:bg-bkg-dark flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-sm transition-colors"
          >
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarDropdown;
