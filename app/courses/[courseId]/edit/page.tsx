"use client";

import React, { useState, useEffect, useCallback } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { cn } from "@lib/utils/style";
import {
  CourseWithDetails,
  CourseModule,
  CourseLesson,
  CourseLessonWithContent,
  ContentItemWithProgress,
} from "@resources/types/content";

// =============================================================================
// COMPONENT
// =============================================================================

export default function CourseEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null); // moduleId
  const [showContentPicker, setShowContentPicker] = useState<string | null>(null); // lessonId
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);

  // Content library for picker
  const [contentLibrary, setContentLibrary] = useState<ContentItemWithProgress[]>([]);
  const [contentSearch, setContentSearch] = useState("");

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const fetchContent = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (contentSearch) params.set("search", contentSearch);
      params.set("limit", "50");

      const response = await fetch(`/api/content/list-content?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContentLibrary(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
    }
  }, [contentSearch]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (showContentPicker) {
      fetchContent();
    }
  }, [showContentPicker, fetchContent]);

  // =============================================================================
  // MODULE HANDLERS
  // =============================================================================

  const handleAddModule = async (title: string, description: string) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/content/add-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          title,
          description,
          sortOrder: course.modules.length,
        }),
      });

      if (response.ok) {
        await fetchCourse();
        setShowAddModule(false);
      }
    } catch (err) {
      console.error("Failed to add module:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateModule = async (moduleId: string, title: string, description: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/content/update-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, title, description }),
      });

      if (response.ok) {
        await fetchCourse();
        setEditingModule(null);
      }
    } catch (err) {
      console.error("Failed to update module:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/content/delete-module?moduleId=${moduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCourse();
      }
    } catch (err) {
      console.error("Failed to delete module:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================================================
  // LESSON HANDLERS
  // =============================================================================

  const handleAddLesson = async (moduleId: string, title: string, description: string) => {
    const courseModule = course?.modules.find((m) => m.id === moduleId);
    if (!courseModule) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/content/add-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          title,
          description,
          sortOrder: courseModule.lessons?.length || 0,
        }),
      });

      if (response.ok) {
        await fetchCourse();
        setShowAddLesson(null);
      }
    } catch (err) {
      console.error("Failed to add lesson:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLesson = async (lessonId: string, title: string, description: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/content/update-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, title, description }),
      });

      if (response.ok) {
        await fetchCourse();
        setEditingLesson(null);
      }
    } catch (err) {
      console.error("Failed to update lesson:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/content/delete-lesson?lessonId=${lessonId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCourse();
      }
    } catch (err) {
      console.error("Failed to delete lesson:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignContent = async (lessonId: string, contentId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/content/update-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, contentId }),
      });

      if (response.ok) {
        await fetchCourse();
        setShowContentPicker(null);
      }
    } catch (err) {
      console.error("Failed to assign content:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================================================
  // COURSE SETTINGS
  // =============================================================================

  const handlePublish = async () => {
    if (!course) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/content/update-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          isPublished: !course.isPublished,
        }),
      });

      if (response.ok) {
        await fetchCourse();
      }
    } catch (err) {
      console.error("Failed to update course:", err);
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="bg-bkg-light-secondary min-h-screen">
      {/* Header */}
      <div className="border-border sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/courses"
                className="text-content-muted hover:text-content-dark rounded-lg p-2 hover:bg-gray-100"
              >
                <i className="gng-arrow-left" />
              </Link>
              <div>
                <h1 className="text-content-dark font-semibold">{course.title}</h1>
                <p className="text-content-muted text-sm">
                  {course.modules.length} modules • {course.totalLessons || 0} lessons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/courses/${course.id}`}
                className="text-content-muted hover:text-content-dark rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
              >
                <i className="gng-eye mr-2" />
                Preview
              </Link>
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className={cn(
                  "rounded-lg px-4 py-2 transition-colors",
                  course.isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-action hover:bg-action/90 text-white"
                )}
              >
                {course.isPublished ? (
                  <>
                    <i className="gng-check mr-2" />
                    Published
                  </>
                ) : (
                  "Publish Course"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Modules */}
        <div className="space-y-4">
          {course.modules.map((module, moduleIndex) => (
            <div
              key={module.id}
              className="border-border overflow-hidden rounded-xl border bg-white"
            >
              {/* Module Header */}
              <div className="border-border flex items-center gap-4 border-b bg-gray-50 p-4">
                <div className="bg-action/10 text-action flex h-8 w-8 items-center justify-center rounded-full font-semibold">
                  {moduleIndex + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-content-dark font-semibold">{module.title}</h3>
                  {module.description && (
                    <p className="text-content-muted line-clamp-1 text-sm">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingModule(module)}
                    className="text-content-muted hover:text-content-dark rounded-lg p-2 hover:bg-white"
                  >
                    <i className="gng-edit-2" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-content-muted rounded-lg p-2 hover:bg-white hover:text-red-600"
                  >
                    <i className="gng-trash-2" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              <div className="divide-border divide-y">
                {(module.lessons || []).map((lesson, lessonIndex) => {
                  const lessonWithContent = lesson as CourseLessonWithContent;
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="text-content-muted flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">
                        {lessonIndex + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-content-dark">{lesson.title}</p>
                        {lessonWithContent.content ? (
                          <p className="text-content-muted flex items-center gap-1 text-xs">
                            <i
                              className={cn(
                                lessonWithContent.content.contentType === "video" &&
                                  "gng-play-circle",
                                lessonWithContent.content.contentType === "document" &&
                                  "gng-file-text",
                                lessonWithContent.content.contentType === "audio" && "gng-music"
                              )}
                            />
                            {lessonWithContent.content.title}
                          </p>
                        ) : (
                          <button
                            onClick={() => setShowContentPicker(lesson.id)}
                            className="text-action text-xs hover:underline"
                          >
                            + Assign content
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {lessonWithContent.content && (
                          <button
                            onClick={() => setShowContentPicker(lesson.id)}
                            className="text-content-muted hover:text-action hover:bg-action/5 rounded-lg p-2"
                            title="Change content"
                          >
                            <i className="gng-link" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingLesson(lesson)}
                          className="text-content-muted hover:text-content-dark rounded-lg p-2 hover:bg-gray-100"
                        >
                          <i className="gng-edit-2" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="text-content-muted rounded-lg p-2 hover:bg-red-50 hover:text-red-600"
                        >
                          <i className="gng-trash-2" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Lesson Button */}
                <button
                  onClick={() => setShowAddLesson(module.id)}
                  className="text-content-muted hover:text-action hover:bg-action/5 flex w-full items-center gap-2 p-4 transition-colors"
                >
                  <i className="gng-plus" />
                  Add lesson
                </button>
              </div>
            </div>
          ))}

          {/* Add Module Button */}
          <button
            onClick={() => setShowAddModule(true)}
            className="text-content-muted hover:border-action hover:text-action flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 transition-colors"
          >
            <i className="gng-plus" />
            Add Module
          </button>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <ModuleModal
          onClose={() => setShowAddModule(false)}
          onSave={handleAddModule}
          isSaving={isSaving}
        />
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <ModuleModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onSave={(title, desc) => handleUpdateModule(editingModule.id, title, desc)}
          isSaving={isSaving}
        />
      )}

      {/* Add Lesson Modal */}
      {showAddLesson && (
        <LessonModal
          onClose={() => setShowAddLesson(null)}
          onSave={(title, desc) => handleAddLesson(showAddLesson, title, desc)}
          isSaving={isSaving}
        />
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={(title, desc) => handleUpdateLesson(editingLesson.id, title, desc)}
          isSaving={isSaving}
        />
      )}

      {/* Content Picker Modal */}
      {showContentPicker && (
        <ContentPickerModal
          content={contentLibrary}
          search={contentSearch}
          onSearch={setContentSearch}
          onSelect={(contentId) => handleAssignContent(showContentPicker, contentId)}
          onClose={() => setShowContentPicker(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// MODULE MODAL
// =============================================================================

interface ModuleModalProps {
  module?: CourseModule;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  isSaving: boolean;
}

function ModuleModal({ module, onClose, onSave, isSaving }: ModuleModalProps) {
  const [title, setTitle] = useState(module?.title || "");
  const [description, setDescription] = useState(module?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white">
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-content-dark text-lg font-semibold">
            {module ? "Edit Module" : "Add Module"}
          </h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-dark rounded-full p-2 hover:bg-gray-100"
          >
            <i className="gng-x" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Getting Started"
              className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this module"
              rows={2}
              className="border-border focus:ring-action/20 focus:border-action w-full resize-none rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-content-dark rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// LESSON MODAL
// =============================================================================

interface LessonModalProps {
  lesson?: CourseLesson;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  isSaving: boolean;
}

function LessonModal({ lesson, onClose, onSave, isSaving }: LessonModalProps) {
  const [title, setTitle] = useState(lesson?.title || "");
  const [description, setDescription] = useState(lesson?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white">
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-content-dark text-lg font-semibold">
            {lesson ? "Edit Lesson" : "Add Lesson"}
          </h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-dark rounded-full p-2 hover:bg-gray-100"
          >
            <i className="gng-x" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="text-content-dark mb-1 block text-sm font-medium">Title</label>
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
              placeholder="Brief description of this lesson"
              rows={2}
              className="border-border focus:ring-action/20 focus:border-action w-full resize-none rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-content-dark rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// CONTENT PICKER MODAL
// =============================================================================

interface ContentPickerModalProps {
  content: ContentItemWithProgress[];
  search: string;
  onSearch: (search: string) => void;
  onSelect: (contentId: string) => void;
  onClose: () => void;
}

function ContentPickerModal({
  content,
  search,
  onSearch,
  onSelect,
  onClose,
}: ContentPickerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white">
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-content-dark text-lg font-semibold">Select Content</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-dark rounded-full p-2 hover:bg-gray-100"
          >
            <i className="gng-x" />
          </button>
        </div>

        {/* Search */}
        <div className="border-border border-b p-4">
          <div className="relative">
            <i className="gng-search text-content-muted absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search content..."
              className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-auto p-4">
          {content.length === 0 ? (
            <div className="py-8 text-center">
              <i className="gng-folder-open mb-2 text-4xl text-gray-300" />
              <p className="text-content-muted">No content found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {content.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="border-border hover:border-action hover:bg-action/5 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      item.contentType === "video" && "bg-red-100 text-red-600",
                      item.contentType === "document" && "bg-blue-100 text-blue-600",
                      item.contentType === "audio" && "bg-purple-100 text-purple-600",
                      item.contentType === "image" && "bg-green-100 text-green-600"
                    )}
                  >
                    <i
                      className={cn(
                        item.contentType === "video" && "gng-play-circle",
                        item.contentType === "document" && "gng-file-text",
                        item.contentType === "audio" && "gng-music",
                        item.contentType === "image" && "gng-image"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-content-dark truncate font-medium">{item.title}</p>
                    <p className="text-content-muted text-xs capitalize">
                      {item.contentType}
                      {item.durationSeconds &&
                        ` • ${Math.floor(item.durationSeconds / 60)}:${(item.durationSeconds % 60).toString().padStart(2, "0")}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
