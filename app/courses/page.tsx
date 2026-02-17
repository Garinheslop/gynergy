"use client";

import React, { useState, useEffect, useCallback } from "react";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@lib/utils/style";
import { CourseWithProgress, DifficultyLevel } from "@resources/types/content";

// =============================================================================
// COMPONENT
// =============================================================================

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/content/list-courses");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to load courses");
      }

      setCourses(json.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreateCourse = async (courseData: {
    title: string;
    description: string;
    difficultyLevel: DifficultyLevel;
  }) => {
    try {
      const response = await fetch("/api/content/create-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      setShowCreateModal(false);
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch("/api/content/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        fetchCourses();
      }
    } catch (err) {
      console.error("Failed to enroll:", err);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="bg-bkg-light-secondary min-h-screen">
      {/* Header */}
      <div className="border-border border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-content-dark text-2xl font-bold">Courses</h1>
              <p className="text-content-muted mt-1">
                Structured learning paths to help you achieve your goals
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-action hover:bg-action/90 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <i className="gng-plus" />
              Create Course
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
            <button onClick={fetchCourses} className="mt-2 text-red-600 underline">
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="border-action h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <div className="py-12 text-center">
            <i className="gng-book-open mb-4 text-5xl text-gray-300" />
            <h3 className="text-content-dark mb-2 text-lg font-medium">No courses yet</h3>
            <p className="text-content-muted mb-4">Create your first course to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-action hover:bg-action/90 rounded-lg px-4 py-2 text-white"
            >
              Create Course
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={() => handleEnroll(course.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCourse}
        />
      )}
    </div>
  );
}

// =============================================================================
// COURSE CARD COMPONENT
// =============================================================================

interface CourseCardProps {
  course: CourseWithProgress;
  onEnroll: () => void;
}

function CourseCard({ course, onEnroll }: CourseCardProps) {
  const isEnrolled = !!course.enrollment;
  const isCompleted = course.enrollment?.status === "completed";

  return (
    <div className="border-border overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="from-action/20 to-action/40 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <i className="gng-book-open text-action text-4xl" />
          </div>
        )}

        {/* Difficulty Badge */}
        {course.difficultyLevel && (
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium capitalize",
                course.difficultyLevel === "beginner" && "bg-green-100 text-green-700",
                course.difficultyLevel === "intermediate" && "bg-yellow-100 text-yellow-700",
                course.difficultyLevel === "advanced" && "bg-red-100 text-red-700"
              )}
            >
              {course.difficultyLevel}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
            <i className="gng-check" />
            Completed
          </div>
        )}

        {/* Progress Bar */}
        {isEnrolled && !isCompleted && course.progressPercent > 0 && (
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/30">
            <div className="bg-action h-full" style={{ width: `${course.progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-content-dark line-clamp-2 min-h-[2.5rem] font-semibold">
          {course.title}
        </h3>

        {course.shortDescription && (
          <p className="text-content-muted mt-1 line-clamp-2 text-sm">{course.shortDescription}</p>
        )}

        {/* Meta Info */}
        <div className="text-content-muted mt-3 flex items-center gap-3 text-xs">
          {course.totalLessons !== undefined && (
            <span className="flex items-center gap-1">
              <i className="gng-play-circle" />
              {course.totalLessons} lessons
            </span>
          )}
          {course.estimatedDurationMinutes && (
            <span className="flex items-center gap-1">
              <i className="gng-clock" />
              {Math.round(course.estimatedDurationMinutes / 60)}h{" "}
              {course.estimatedDurationMinutes % 60}m
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4">
          {isEnrolled ? (
            <Link
              href={`/courses/${course.id}`}
              className="bg-action hover:bg-action/90 block w-full rounded-lg px-4 py-2 text-center text-white transition-colors"
            >
              {course.progressPercent > 0 ? "Continue Learning" : "Start Course"}
            </Link>
          ) : (
            <button
              onClick={onEnroll}
              className="border-action text-action hover:bg-action/5 w-full rounded-lg border px-4 py-2 transition-colors"
            >
              {course.isFree ? "Enroll Free" : "Enroll Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CREATE COURSE MODAL
// =============================================================================

interface CreateCourseModalProps {
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    difficultyLevel: DifficultyLevel;
  }) => void;
}

function CreateCourseModal({ onClose, onCreate }: CreateCourseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("beginner");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onCreate({ title: title.trim(), description: description.trim(), difficultyLevel });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white">
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-content-dark text-xl font-semibold">Create New Course</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-dark rounded-full p-2 hover:bg-gray-100"
          >
            <i className="gng-x text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Mindfulness"
              className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this course?"
              rows={3}
              className="border-border focus:ring-action/20 focus:border-action w-full resize-none rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">
              Difficulty Level
            </label>
            <div className="flex gap-2">
              {(["beginner", "intermediate", "advanced"] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyLevel(level)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm capitalize transition-colors",
                    difficultyLevel === level
                      ? level === "beginner"
                        ? "border border-green-300 bg-green-100 text-green-700"
                        : level === "intermediate"
                          ? "border border-yellow-300 bg-yellow-100 text-yellow-700"
                          : "border border-red-300 bg-red-100 text-red-700"
                      : "text-content-muted bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-content-dark rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
