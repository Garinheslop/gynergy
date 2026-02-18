"use client";

import React, { useState, useEffect, useCallback } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";

import LessonQuiz from "@modules/courses/components/LessonQuiz";

import { cn } from "@lib/utils/style";
import {
  CourseWithProgress,
  CourseModuleWithLessons,
  CourseLessonWithContent,
} from "@resources/types/content";

// Dynamic import for VideoPlayer
const VideoPlayer = dynamic(() => import("@modules/content/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-900">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  ),
});

// =============================================================================
// COMPONENT
// =============================================================================

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLesson, setActiveLesson] = useState<CourseLessonWithContent | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/content/get-course?courseId=${courseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load course");
      }

      setCourse(data.course);

      // Expand first module by default
      if (data.course.modules?.length > 0) {
        setExpandedModules(new Set([data.course.modules[0].id]));

        // Set first incomplete lesson as active, or first lesson if all complete
        const firstIncomplete = findFirstIncompleteLesson(data.course.modules);
        if (firstIncomplete) {
          setActiveLesson(firstIncomplete);
        } else if (data.course.modules[0].lessons?.length > 0) {
          setActiveLesson(data.course.modules[0].lessons[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // =============================================================================
  // HELPERS
  // =============================================================================

  const findFirstIncompleteLesson = (
    modules: CourseModuleWithLessons[]
  ): CourseLessonWithContent | null => {
    for (const courseModule of modules) {
      for (const lesson of courseModule.lessons || []) {
        if (!lesson.isCompleted) {
          return lesson as CourseLessonWithContent;
        }
      }
    }
    return null;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleLessonClick = (lesson: CourseLessonWithContent) => {
    setActiveLesson(lesson);
  };

  const handleProgress = async (percent: number, currentTime: number) => {
    if (!activeLesson?.contentId) return;

    try {
      await fetch("/api/content/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: activeLesson.contentId,
          progressPercent: Math.round(percent),
          lastPositionSeconds: Math.round(currentTime),
        }),
      });

      // Update local state
      if (course) {
        setCourse({
          ...course,
          modules: course.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === activeLesson.id
                ? {
                    ...l,
                    progressPercent: Math.max(l.progressPercent, Math.round(percent)),
                    isCompleted: percent >= 95,
                  }
                : l
            ),
          })),
        });
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const handleComplete = () => {
    if (!activeLesson || !course) return;

    // Update local state
    setCourse({
      ...course,
      modules: course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) =>
          l.id === activeLesson.id ? { ...l, progressPercent: 100, isCompleted: true } : l
        ),
      })),
    });

    // Auto-advance to next lesson
    const nextLesson = findNextLesson();
    if (nextLesson) {
      setActiveLesson(nextLesson);
    }
  };

  const findNextLesson = (): CourseLessonWithContent | null => {
    if (!course || !activeLesson) return null;

    let foundCurrent = false;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        if (foundCurrent) {
          return lesson as CourseLessonWithContent;
        }
        if (lesson.id === activeLesson.id) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const findPrevLesson = (): CourseLessonWithContent | null => {
    if (!course || !activeLesson) return null;

    let prevLesson: CourseLessonWithContent | null = null;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        if (lesson.id === activeLesson.id) {
          return prevLesson;
        }
        prevLesson = lesson as CourseLessonWithContent;
      }
    }
    return null;
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (!course) return { completed: 0, total: 0, percent: 0 };

    let completed = 0;
    let total = 0;

    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons || []) {
        total++;
        if (lesson.isCompleted) completed++;
      }
    }

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center">
        <div className="border-action h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <i className="gng-alert-circle mb-4 text-4xl text-red-500" />
          <h2 className="text-content-dark mb-2 text-xl font-semibold">
            {error || "Course not found"}
          </h2>
          <Link href="/courses" className="text-action hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const prevLesson = findPrevLesson();
  const nextLesson = findNextLesson();

  return (
    <div className="bg-bkg-light-secondary flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar - Course Outline */}
      <div className="border-border flex w-full flex-col border-r bg-white lg:sticky lg:top-0 lg:h-screen lg:w-80 xl:w-96">
        {/* Course Header */}
        <div className="border-border border-b p-4">
          <Link
            href="/courses"
            className="text-content-muted hover:text-action mb-3 inline-flex items-center gap-1 text-sm"
          >
            <i className="gng-arrow-left" />
            All Courses
          </Link>
          <h1 className="text-content-dark line-clamp-2 font-semibold">{course.title}</h1>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="text-content-muted mb-1 flex items-center justify-between text-xs">
              <span>
                {progress.completed} of {progress.total} lessons
              </span>
              <span>{progress.percent}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-action h-full transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-auto">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-border border-b">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="text-content-muted flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                  {moduleIndex + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-content-dark line-clamp-1 text-sm font-medium">
                    {module.title}
                  </h3>
                  <p className="text-content-muted text-xs">
                    {module.lessons?.length || 0} lessons
                  </p>
                </div>
                <i
                  className={cn(
                    "gng-chevron-down text-content-muted transition-transform",
                    expandedModules.has(module.id) && "rotate-180"
                  )}
                />
              </button>

              {/* Lessons List */}
              {expandedModules.has(module.id) && (
                <div className="pb-2">
                  {(module.lessons || []).map((lesson, lessonIndex) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const hasContent = !!lesson.content;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson as CourseLessonWithContent)}
                        disabled={!hasContent}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                          isActive
                            ? "bg-action/10 border-action border-l-2"
                            : "border-l-2 border-transparent hover:bg-gray-50",
                          !hasContent && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs",
                            lesson.isCompleted
                              ? "bg-green-500 text-white"
                              : isActive
                                ? "bg-action text-white"
                                : "text-content-muted border border-gray-300"
                          )}
                        >
                          {lesson.isCompleted ? (
                            <i className="gng-check text-xs" />
                          ) : (
                            lessonIndex + 1
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "line-clamp-1 text-sm",
                              isActive ? "text-action font-medium" : "text-content-dark"
                            )}
                          >
                            {lesson.title}
                          </p>
                          {lesson.content?.durationSeconds && (
                            <p className="text-content-muted text-xs">
                              {Math.floor(lesson.content.durationSeconds / 60)}:
                              {(lesson.content.durationSeconds % 60).toString().padStart(2, "0")}
                            </p>
                          )}
                        </div>

                        {/* Content Type Icon */}
                        {lesson.content && (
                          <i
                            className={cn(
                              "text-content-muted text-sm",
                              lesson.content.contentType === "video" && "gng-play-circle",
                              lesson.content.contentType === "document" && "gng-file-text",
                              lesson.content.contentType === "audio" && "gng-music"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {activeLesson ? (
          <>
            {/* Lesson Content */}
            <div className="flex-1 p-4 lg:p-8">
              <div className="mx-auto max-w-4xl">
                {/* Video Player */}
                {activeLesson.content?.contentType === "video" &&
                  activeLesson.content.streamUrl && (
                    <div className="mb-6">
                      <VideoPlayer
                        src={activeLesson.content.streamUrl}
                        poster={activeLesson.content.thumbnailUrl}
                        title={activeLesson.title}
                        startAt={0}
                        onProgress={handleProgress}
                        onComplete={handleComplete}
                      />
                    </div>
                  )}

                {/* Document Viewer */}
                {activeLesson.content?.contentType === "document" &&
                  activeLesson.content.storageUrl && (
                    <div className="mb-6">
                      <iframe
                        src={activeLesson.content.storageUrl}
                        className="border-border h-[70vh] w-full rounded-lg border"
                        title={activeLesson.title}
                      />
                    </div>
                  )}

                {/* Audio Player */}
                {activeLesson.content?.contentType === "audio" &&
                  activeLesson.content.storageUrl && (
                    <div className="border-border mb-6 rounded-xl border bg-white p-8">
                      <div className="flex items-center justify-center">
                        <audio
                          src={activeLesson.content.storageUrl}
                          controls
                          className="w-full max-w-md"
                        />
                      </div>
                    </div>
                  )}

                {/* Lesson Title & Description */}
                <div className="border-border rounded-xl border bg-white p-6">
                  <h2 className="text-content-dark mb-2 text-xl font-semibold">
                    {activeLesson.title}
                  </h2>
                  {activeLesson.description && (
                    <p className="text-content-muted">{activeLesson.description}</p>
                  )}
                </div>

                {/* Lesson Quiz */}
                <LessonQuiz
                  lessonId={activeLesson.id}
                  onComplete={(passed) => {
                    if (passed) handleComplete();
                  }}
                  onContinue={() => {
                    const next = findNextLesson();
                    if (next) setActiveLesson(next);
                  }}
                />
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="border-border border-t bg-white p-4">
              <div className="mx-auto flex max-w-4xl items-center justify-between">
                <button
                  onClick={() => prevLesson && setActiveLesson(prevLesson)}
                  disabled={!prevLesson}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                    prevLesson
                      ? "text-content-dark hover:bg-gray-100"
                      : "cursor-not-allowed text-gray-300"
                  )}
                >
                  <i className="gng-arrow-left" />
                  Previous
                </button>

                {!activeLesson.isCompleted && activeLesson.content?.contentType !== "video" && (
                  <button
                    onClick={handleComplete}
                    className="rounded-lg bg-green-500 px-6 py-2 text-white transition-colors hover:bg-green-600"
                  >
                    <i className="gng-check mr-2" />
                    Mark Complete
                  </button>
                )}

                <button
                  onClick={() => nextLesson && setActiveLesson(nextLesson)}
                  disabled={!nextLesson}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
                    nextLesson
                      ? "bg-action hover:bg-action/90 text-white"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  )}
                >
                  Next
                  <i className="gng-arrow-right" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <i className="gng-play-circle mb-4 text-5xl text-gray-300" />
              <h3 className="text-content-dark mb-2 text-lg font-medium">
                Select a lesson to begin
              </h3>
              <p className="text-content-muted">
                Choose a lesson from the sidebar to start learning
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
