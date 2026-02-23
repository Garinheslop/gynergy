"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout, StatCard } from "@modules/admin";

interface CohortSession {
  id: string;
  bookId: string;
  bookName: string;
  bookSlug: string;
  cohortLabel: string;
  status: "upcoming" | "active" | "grace_period" | "completed";
  startDate: string;
  endDate: string;
  gracePeriodEnd: string | null;
  maxEnrollments: number;
  enrollmentCount: number;
  durationDays: number;
  cohortId: string | null;
  cohortSlug: string | null;
  createdAt: string;
}

interface CohortStats {
  totalCohorts: number;
  activeCohorts: number;
  upcomingCohorts: number;
  totalEnrolled: number;
  gracePeriodCohorts: number;
  completedCohorts: number;
  nextLaunch: string | null;
}

interface BookOption {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  duration_days: number;
}

interface CohortData {
  stats: CohortStats;
  sessions: CohortSession[];
  books: BookOption[];
}

const defaultData: CohortData = {
  stats: {
    totalCohorts: 0,
    activeCohorts: 0,
    upcomingCohorts: 0,
    totalEnrolled: 0,
    gracePeriodCohorts: 0,
    completedCohorts: 0,
    nextLaunch: null,
  },
  sessions: [],
  books: [],
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: { bg: "bg-blue-900/30", text: "text-blue-400", label: "Upcoming" },
  active: { bg: "bg-action-900/30", text: "text-action-400", label: "Active" },
  grace_period: { bg: "bg-yellow-900/30", text: "text-yellow-400", label: "Grace Period" },
  completed: { bg: "bg-grey-800", text: "text-grey-400", label: "Completed" },
};

export default function CohortsPage() {
  const [data, setData] = useState<CohortData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<CohortSession | null>(null);
  const [formError, setFormError] = useState("");

  // Create form state
  const [createBookId, setCreateBookId] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createMaxEnrollments, setCreateMaxEnrollments] = useState("15");

  // Edit form state
  const [editLabel, setEditLabel] = useState("");
  const [editMaxEnrollments, setEditMaxEnrollments] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/cohorts");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
          // Auto-select book if only one exists
          if (result.data.books?.length === 1) {
            setCreateBookId((prev) => prev || result.data.books[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching cohort data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    setFormError("");

    if (!createBookId) {
      setFormError("Please select a book");
      return;
    }
    if (!createStartDate) {
      setFormError("Start date is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: {
            bookId: createBookId,
            label: createLabel || undefined,
            startDate: createStartDate,
            maxEnrollments: parseInt(createMaxEnrollments) || 15,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        setCreateLabel("");
        setCreateStartDate("");
        setCreateMaxEnrollments("15");
        fetchData();
      } else {
        setFormError(result.error || "Failed to create cohort");
      }
    } catch (error) {
      console.error("Error creating cohort:", error);
      setFormError("Failed to create cohort");
    }
  };

  const handleUpdate = async () => {
    if (!editingSession) return;
    setFormError("");

    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          data: {
            sessionId: editingSession.id,
            label: editLabel || undefined,
            maxEnrollments: editMaxEnrollments ? parseInt(editMaxEnrollments) : undefined,
            status: editStatus || undefined,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        setEditingSession(null);
        fetchData();
      } else {
        setFormError(result.error || "Failed to update cohort");
      }
    } catch (error) {
      console.error("Error updating cohort:", error);
      setFormError("Failed to update cohort");
    }
  };

  const openEdit = (session: CohortSession) => {
    setEditingSession(session);
    setEditLabel(session.cohortLabel);
    setEditMaxEnrollments(String(session.maxEnrollments));
    setEditStatus(session.status);
    setFormError("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <AdminLayout title="Cohort Management" subtitle="Create and manage challenge cohort launches">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Cohorts" value={data.stats.totalCohorts} icon="gng-users" />
        <StatCard title="Active Cohorts" value={data.stats.activeCohorts} icon="gng-fire" />
        <StatCard title="Total Enrolled" value={data.stats.totalEnrolled} icon="gng-user" />
        <StatCard
          title="Next Launch"
          value={data.stats.nextLaunch ? formatDate(data.stats.nextLaunch) : "None scheduled"}
          icon="gng-calendar"
        />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Cohort Sessions</h3>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setFormError("");
          }}
          className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <i className="gng-plus" />
          Launch New Cohort
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-action-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.sessions.map((session) => {
            const statusStyle = statusColors[session.status] || statusColors.completed;
            const fillPercent = session.maxEnrollments
              ? Math.min((session.enrollmentCount / session.maxEnrollments) * 100, 100)
              : 0;
            const isFull = session.enrollmentCount >= session.maxEnrollments;

            return (
              <div
                key={session.id}
                className="border-grey-800 bg-grey-900 hover:border-grey-700 rounded-xl border p-5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-white">{session.cohortLabel}</h4>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusStyle.bg,
                          statusStyle.text
                        )}
                      >
                        {statusStyle.label}
                      </span>
                      {isFull && (
                        <span className="rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          Full
                        </span>
                      )}
                    </div>

                    <div className="text-grey-400 mb-3 flex flex-wrap items-center gap-4 text-sm">
                      <span>
                        <i className="gng-calendar mr-1" />
                        {formatDate(session.startDate)} — {formatDate(session.endDate)}
                      </span>
                      <span>
                        <i className="gng-clock mr-1" />
                        {session.durationDays} days
                      </span>
                      {session.gracePeriodEnd && (
                        <span>
                          <i className="gng-shield mr-1" />
                          Grace until {formatDate(session.gracePeriodEnd)}
                        </span>
                      )}
                      {session.status === "active" && (
                        <span className="text-action-400">
                          <i className="gng-fire mr-1" />
                          {getDaysRemaining(session.endDate)} days remaining
                        </span>
                      )}
                      {session.status === "grace_period" && session.gracePeriodEnd && (
                        <span className="text-yellow-400">
                          <i className="gng-clock mr-1" />
                          {getDaysRemaining(session.gracePeriodEnd)} days of grace left
                        </span>
                      )}
                    </div>

                    {/* Enrollment bar */}
                    <div className="flex items-center gap-3">
                      <div className="bg-grey-800 h-2 w-48 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isFull
                              ? "bg-red-500"
                              : fillPercent > 75
                                ? "bg-yellow-500"
                                : "bg-action-500"
                          )}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <span className="text-grey-400 text-sm">
                        <span className="font-medium text-white">{session.enrollmentCount}</span>
                        {" / "}
                        {session.maxEnrollments} enrolled
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEdit(session)}
                    className="text-grey-400 hover:bg-grey-800 ml-4 rounded-lg p-2 transition-colors hover:text-white"
                  >
                    <i className="gng-edit text-lg" />
                  </button>
                </div>
              </div>
            );
          })}

          {data.sessions.length === 0 && (
            <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
              <i className="gng-users text-grey-600 mb-4 text-4xl" />
              <h3 className="mb-2 text-lg font-medium text-white">No Cohorts Yet</h3>
              <p className="text-grey-400 mb-4">
                Launch your first cohort to start separating challenge groups
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-action-600 hover:bg-action-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Launch First Cohort
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-grey-900 border-grey-800 mx-4 w-full max-w-md rounded-2xl border p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Launch New Cohort</h3>

            <div className="space-y-4">
              {data.books.length > 1 && (
                <div>
                  <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                    Book <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={createBookId}
                    onChange={(e) => setCreateBookId(e.target.value)}
                    className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="">Select a book...</option>
                    {data.books.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                  Cohort Label
                </label>
                <input
                  type="text"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                  placeholder="e.g., March 2026 Cohort"
                  className="bg-grey-800 border-grey-700 focus:border-action-500 placeholder-grey-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                />
                <p className="text-grey-500 mt-1 text-xs">
                  Leave blank for auto-generated label based on start date
                </p>
              </div>

              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={createStartDate}
                  onChange={(e) => setCreateStartDate(e.target.value)}
                  className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                />
                {createStartDate &&
                  (() => {
                    const selectedBook = data.books.find((b) => b.id === createBookId);
                    const duration = selectedBook?.duration_days || 45;
                    const startMs = new Date(createStartDate + "T00:00:00Z").getTime();
                    return (
                      <p className="text-grey-500 mt-1 text-xs">
                        End Date:{" "}
                        {formatDate(
                          new Date(startMs + duration * 24 * 60 * 60 * 1000).toISOString()
                        )}{" "}
                        ({duration} days) | Grace Period End:{" "}
                        {formatDate(
                          new Date(startMs + (duration + 30) * 24 * 60 * 60 * 1000).toISOString()
                        )}{" "}
                        (+30 days)
                      </p>
                    );
                  })()}
              </div>

              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                  Max Enrollments
                </label>
                <input
                  type="number"
                  value={createMaxEnrollments}
                  onChange={(e) => setCreateMaxEnrollments(e.target.value)}
                  min="1"
                  max="1000"
                  className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                />
                <p className="text-grey-500 mt-1 text-xs">
                  Includes purchaser + friend code users (Trio model = 3 per purchase)
                </p>
              </div>
            </div>

            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-grey-400 hover:bg-grey-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-action-600 hover:bg-action-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Launch Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-grey-900 border-grey-800 mx-4 w-full max-w-md rounded-2xl border p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Edit Cohort</h3>

            <div className="space-y-4">
              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                  Cohort Label
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">
                  Max Enrollments
                </label>
                <input
                  type="number"
                  value={editMaxEnrollments}
                  onChange={(e) => setEditMaxEnrollments(e.target.value)}
                  min="1"
                  max="1000"
                  className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                />
                {editingSession.enrollmentCount > 0 && (
                  <p className="text-grey-500 mt-1 text-xs">
                    Currently {editingSession.enrollmentCount} enrolled
                  </p>
                )}
              </div>

              <div>
                <label className="text-grey-300 mb-1.5 block text-sm font-medium">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="bg-grey-800 border-grey-700 focus:border-action-500 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Read-only info */}
              <div className="border-grey-800 bg-grey-800/50 rounded-lg border p-3">
                <p className="text-grey-500 mb-1 text-xs font-medium uppercase">Session Dates</p>
                <p className="text-grey-300 text-sm">
                  {formatDate(editingSession.startDate)} — {formatDate(editingSession.endDate)}
                </p>
                {editingSession.gracePeriodEnd && (
                  <p className="text-grey-400 mt-1 text-xs">
                    Grace period ends: {formatDate(editingSession.gracePeriodEnd)}
                  </p>
                )}
              </div>
            </div>

            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingSession(null)}
                className="text-grey-400 hover:bg-grey-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-action-600 hover:bg-action-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
