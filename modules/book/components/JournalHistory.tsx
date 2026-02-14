"use client";

import { useState, useEffect, useCallback } from "react";

import dayjs from "dayjs";

import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import { journalTypes } from "@resources/types/journal";
import { headingVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";

interface JournalEntry {
  id: string;
  sessionId: string;
  bookId: string;
  userId: string;
  entryDate: string;
  journalType: string;
  isCompleted: boolean;
  moodScore?: number;
  capturedEssence?: string;
  insight?: string;
  wins?: string;
  challenges?: string;
  lessons?: string;
  createdAt: string;
  updatedAt?: string;
}

interface JournalHistoryProps {
  sessionId?: string;
  onSelectJournal?: (journal: JournalEntry) => void;
}

const JOURNAL_TYPE_LABELS: Record<string, string> = {
  [journalTypes.morningJournal]: "Morning",
  [journalTypes.eveningJournal]: "Evening",
  [journalTypes.weeklyReflection]: "Weekly",
  [journalTypes.gratitudeAction]: "Gratitude",
};

const JOURNAL_TYPE_COLORS: Record<string, string> = {
  [journalTypes.morningJournal]: "bg-yellow-500",
  [journalTypes.eveningJournal]: "bg-purple-500",
  [journalTypes.weeklyReflection]: "bg-blue-500",
  [journalTypes.gratitudeAction]: "bg-green-500",
};

export default function JournalHistory({ sessionId, onSelectJournal }: JournalHistoryProps) {
  const enrollment = useSelector((state) => state.enrollments.current);
  const effectiveSessionId = sessionId || enrollment?.session?.id;

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
    offset: 0,
  });

  const fetchJournals = useCallback(async () => {
    if (!effectiveSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
      });

      if (effectiveSessionId) {
        params.set("sessionId", effectiveSessionId);
      }

      // Filter by selected month
      const startDate = selectedMonth.startOf("month").toISOString();
      const endDate = selectedMonth.endOf("month").toISOString();
      params.set("startDate", startDate);
      params.set("endDate", endDate);

      if (selectedType !== "all") {
        params.set("journalType", selectedType);
      }

      const res = await fetch(`/api/journals/user-journal-history?${params}`, {
        headers: {
          "x-user-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch journals");
      }

      const data = await res.json();
      setJournals(data.journals || []);
      setPagination({
        total: data.total || 0,
        hasMore: data.hasMore || false,
        offset: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveSessionId, selectedMonth, selectedType]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => prev.add(1, "month"));
  };

  const handleJournalClick = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    onSelectJournal?.(journal);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const startOfMonth = selectedMonth.startOf("month");
    const endOfMonth = selectedMonth.endOf("month");
    const startDay = startOfMonth.day(); // 0-6 (Sun-Sat)
    const daysInMonth = endOfMonth.date();

    const days: Array<{ date: dayjs.Dayjs | null; journals: JournalEntry[] }> = [];

    // Add empty cells for days before the start of month
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, journals: [] });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = selectedMonth.date(day);
      const dayJournals = journals.filter((j) => dayjs(j.entryDate).isSame(date, "day"));
      days.push({ date, journals: dayJournals });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Group journals by date for list view
  const journalsByDate = journals.reduce(
    (acc, journal) => {
      const dateKey = dayjs(journal.entryDate).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(journal);
      return acc;
    },
    {} as Record<string, JournalEntry[]>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading variant={headingVariants.sectionHeading} sx="!font-bold">
          Journal History
        </Heading>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          {[
            "all",
            journalTypes.morningJournal,
            journalTypes.eveningJournal,
            journalTypes.weeklyReflection,
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                selectedType === type
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {type === "all" ? "All" : JOURNAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="text-grey-400 rounded-lg p-2 transition-colors hover:text-white"
        >
          <i className="gng-chevron-left text-xl" />
        </button>

        <h3 className="text-lg font-semibold text-white">{selectedMonth.format("MMMM YYYY")}</h3>

        <button
          onClick={handleNextMonth}
          disabled={selectedMonth.isSame(dayjs(), "month")}
          className={cn(
            "rounded-lg p-2 transition-colors",
            selectedMonth.isSame(dayjs(), "month")
              ? "text-grey-600 cursor-not-allowed"
              : "text-grey-400 hover:text-white"
          )}
        >
          <i className="gng-chevron-right text-xl" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="border-action-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 p-4 text-center text-red-400">{error}</div>
      ) : (
        <>
          {/* Calendar View */}
          <div className="border-grey-800 bg-grey-900 overflow-hidden rounded-xl border">
            {/* Day Headers */}
            <div className="border-grey-800 grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-grey-400 py-3 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "border-grey-800 min-h-[80px] border-r border-b p-2",
                    day.date === null && "bg-grey-900/50",
                    day.date?.isSame(dayjs(), "day") && "bg-action-900/20"
                  )}
                >
                  {day.date && (
                    <>
                      <span
                        className={cn(
                          "text-sm",
                          day.date.isSame(dayjs(), "day")
                            ? "text-action-400 font-bold"
                            : "text-grey-400"
                        )}
                      >
                        {day.date.date()}
                      </span>

                      {/* Journal Indicators */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {day.journals.map((journal) => (
                          <button
                            key={journal.id}
                            onClick={() => handleJournalClick(journal)}
                            className={cn(
                              "h-2 w-2 rounded-full transition-transform hover:scale-150",
                              JOURNAL_TYPE_COLORS[journal.journalType] || "bg-grey-500"
                            )}
                            title={JOURNAL_TYPE_LABELS[journal.journalType]}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(JOURNAL_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className={cn("h-3 w-3 rounded-full", JOURNAL_TYPE_COLORS[type] || "bg-grey-500")}
                />
                <span className="text-grey-400 text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <p className="text-grey-400 text-sm">Total Entries</p>
              <p className="text-action-400 mt-1 text-2xl font-bold">{pagination.total}</p>
            </div>
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <p className="text-grey-400 text-sm">This Month</p>
              <p className="mt-1 text-2xl font-bold text-white">{journals.length}</p>
            </div>
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
              <p className="text-grey-400 text-sm">Days Journaled</p>
              <p className="text-primary mt-1 text-2xl font-bold">
                {Object.keys(journalsByDate).length}
              </p>
            </div>
          </div>

          {/* Journal List */}
          {journals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent Entries</h3>
              <div className="space-y-2">
                {journals.slice(0, 10).map((journal) => (
                  <button
                    key={journal.id}
                    onClick={() => handleJournalClick(journal)}
                    className="border-grey-800 bg-grey-900 hover:bg-grey-800 flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        JOURNAL_TYPE_COLORS[journal.journalType]?.replace("bg-", "bg-") + "/20"
                      )}
                    >
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          JOURNAL_TYPE_COLORS[journal.journalType]
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {JOURNAL_TYPE_LABELS[journal.journalType] || journal.journalType} Journal
                      </p>
                      <p className="text-grey-400 text-sm">
                        {dayjs(journal.entryDate).format("MMMM D, YYYY")}
                      </p>
                    </div>
                    {journal.moodScore && (
                      <div className="text-right">
                        <p className="text-grey-400 text-xs">Mood</p>
                        <p className="text-action-400 font-semibold">{journal.moodScore}/10</p>
                      </div>
                    )}
                    <i className="gng-chevron-right text-grey-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {journals.length === 0 && (
            <div className="text-grey-400 py-12 text-center">
              No journal entries found for this month.
            </div>
          )}
        </>
      )}

      {/* Journal Detail Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-grey-900 border-grey-800 w-full max-w-lg rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {JOURNAL_TYPE_LABELS[selectedJournal.journalType]} Journal
              </h3>
              <button
                onClick={() => setSelectedJournal(null)}
                className="text-grey-400 hover:text-white"
              >
                <i className="gng-close text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-grey-500 text-sm">Date</p>
                <p className="text-white">
                  {dayjs(selectedJournal.entryDate).format("MMMM D, YYYY h:mm A")}
                </p>
              </div>

              {selectedJournal.moodScore && (
                <div>
                  <p className="text-grey-500 text-sm">Mood Score</p>
                  <p className="text-action-400 text-2xl font-bold">
                    {selectedJournal.moodScore}/10
                  </p>
                </div>
              )}

              {selectedJournal.capturedEssence && (
                <div>
                  <p className="text-grey-500 text-sm">Captured Essence</p>
                  <p className="text-white">{selectedJournal.capturedEssence}</p>
                </div>
              )}

              {selectedJournal.insight && (
                <div>
                  <p className="text-grey-500 text-sm">Insight</p>
                  <p className="text-white">{selectedJournal.insight}</p>
                </div>
              )}

              {selectedJournal.wins && (
                <div>
                  <p className="text-grey-500 text-sm">Wins</p>
                  <p className="text-white">{selectedJournal.wins}</p>
                </div>
              )}

              {selectedJournal.challenges && (
                <div>
                  <p className="text-grey-500 text-sm">Challenges</p>
                  <p className="text-white">{selectedJournal.challenges}</p>
                </div>
              )}

              {selectedJournal.lessons && (
                <div>
                  <p className="text-grey-500 text-sm">Lessons</p>
                  <p className="text-white">{selectedJournal.lessons}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
