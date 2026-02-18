/**
 * Calendar Utility Functions
 *
 * Shared calendar generation utilities for Google Calendar URLs,
 * Apple/Outlook ICS files, and date formatting.
 *
 * Extracted from lib/email/webinar.ts for client-side reuse.
 */

export interface CalendarEventParams {
  title: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
  location: string;
  organizer?: string;
}

/**
 * Format a Date to ICS format: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generate ICS calendar file content for Apple Calendar / Outlook
 */
export function generateICSContent(params: CalendarEventParams): string {
  const {
    title,
    description,
    startDate,
    durationMinutes,
    location,
    organizer = "Gynergy",
  } = params;

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const uid = `event-${startDate.getTime()}@gynergy.app`;
  const now = formatICSDate(new Date());

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gynergy//Events//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
ORGANIZER;CN=${organizer}:mailto:hello@gynergy.app
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${title} tomorrow
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${title} in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate a Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const { title, description, startDate, durationMinutes, location } = params;

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatICSDate(startDate)}/${formatICSDate(endDate)}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
}

/**
 * Download an ICS file by creating a temporary link
 */
export function downloadICSFile(params: CalendarEventParams): void {
  const icsContent = generateICSContent(params);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${params.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
