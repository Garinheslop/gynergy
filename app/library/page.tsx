"use client";

import React, { useState, useEffect, useCallback } from "react";

import dynamic from "next/dynamic";

import { cn } from "@lib/utils/style";
import ContentCard from "@modules/content/components/ContentCard";
import UploadModal from "@modules/content/components/UploadModal";
import {
  ContentType,
  ContentItem,
  ContentItemWithProgress,
  ContentListResponse,
} from "@resources/types/content";

// Dynamic imports for heavy components
const VideoPlayer = dynamic(() => import("@modules/content/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-900">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  ),
});

// =============================================================================
// TYPES
// =============================================================================

type ViewMode = "grid" | "list";
type FilterType = "all" | ContentType;

// =============================================================================
// COMPONENT
// =============================================================================

export default function LibraryPage() {
  const [content, setContent] = useState<ContentItemWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<"created_at" | "title">("created_at");

  const [selectedContent, setSelectedContent] = useState<ContentItemWithProgress | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchContent = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filter !== "all") params.set("contentType", filter);
        if (search) params.set("search", search);
        params.set("sortBy", sortBy);
        params.set("limit", "20");
        params.set("offset", reset ? "0" : ((page - 1) * 20).toString());

        const response = await fetch(`/api/content/list-content?${params}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to load content");
        }

        const data: ContentListResponse = json.data;
        setContent(reset ? data.items : [...content, ...data.items]);
        setTotal(data.total);
        setHasMore(data.hasMore);
        if (reset) setPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    },
    [filter, search, sortBy, page, content]
  );

  useEffect(() => {
    fetchContent(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, sortBy]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleContentClick = (item: ContentItemWithProgress) => {
    setSelectedContent(item);
  };

  const handleBookmark = async (item: ContentItemWithProgress) => {
    try {
      if (item.isBookmarked) {
        await fetch(`/api/content/remove-bookmark?contentId=${item.id}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/content/add-bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: item.id }),
        });
      }

      // Update local state
      setContent((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isBookmarked: !c.isBookmarked } : c))
      );
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const handleProgress = async (contentId: string, percent: number, currentTime: number) => {
    try {
      await fetch("/api/content/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          progressPercent: Math.round(percent),
          lastPositionSeconds: Math.round(currentTime),
        }),
      });

      // Update local state
      setContent((prev) =>
        prev.map((c) =>
          c.id === contentId
            ? {
                ...c,
                progressPercent: Math.max(c.progressPercent, Math.round(percent)),
                isCompleted: percent >= 95,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const handleComplete = (contentId: string) => {
    setContent((prev) =>
      prev.map((c) => (c.id === contentId ? { ...c, progressPercent: 100, isCompleted: true } : c))
    );
  };

  const closeViewer = () => {
    setSelectedContent(null);
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="bg-bkg-light-secondary min-h-screen">
      {/* Header */}
      <div className="border-border sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-content-dark text-2xl font-bold">Content Library</h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-action hover:bg-action/90 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <i className="gng-upload" />
              Upload
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <i className="gng-search text-content-muted absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              {(["all", "video", "document", "audio"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                    filter === type
                      ? "text-action bg-white shadow-sm"
                      : "text-content-muted hover:text-content-dark"
                  )}
                >
                  {type === "all" ? "All" : type}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "created_at" | "title")}
              className="border-border focus:ring-action/20 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="created_at">Newest</option>
              <option value="title">Title</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "grid"
                    ? "text-action bg-white shadow-sm"
                    : "text-content-muted hover:text-content-dark"
                )}
              >
                <i className="gng-grid" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "list"
                    ? "text-action bg-white shadow-sm"
                    : "text-content-muted hover:text-content-dark"
                )}
              >
                <i className="gng-list" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <p className="text-content-muted mb-4 text-sm">
          {total} {total === 1 ? "item" : "items"}
          {filter !== "all" && ` • Filtered by ${filter}`}
        </p>

        {/* Error State */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
            <button onClick={() => fetchContent(true)} className="mt-2 text-red-600 underline">
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && content.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="border-action h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && content.length === 0 && (
          <div className="py-12 text-center">
            <i className="gng-folder-open mb-4 text-5xl text-gray-300" />
            <h3 className="text-content-dark mb-2 text-lg font-medium">No content found</h3>
            <p className="text-content-muted mb-4">
              {search
                ? "Try adjusting your search or filters"
                : "Upload some content to get started"}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-action hover:bg-action/90 rounded-lg px-4 py-2 text-white"
            >
              Upload Content
            </button>
          </div>
        )}

        {/* Content Grid/List */}
        {content.length > 0 && (
          <>
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-4"
              )}
            >
              {content.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  variant={viewMode === "list" ? "horizontal" : "default"}
                  onClick={() => handleContentClick(item)}
                  onBookmark={() => handleBookmark(item)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchContent(false);
                  }}
                  disabled={isLoading}
                  className="border-action text-action hover:bg-action/5 rounded-lg border px-6 py-2 disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white">
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b p-4">
              <h2 className="text-content-dark truncate text-xl font-semibold">
                {selectedContent.title}
              </h2>
              <button
                onClick={closeViewer}
                className="text-content-muted hover:text-content-dark rounded-full p-2 hover:bg-gray-100"
              >
                <i className="gng-x text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {selectedContent.contentType === "video" && selectedContent.streamUrl && (
                <VideoPlayer
                  src={selectedContent.streamUrl}
                  poster={selectedContent.thumbnailUrl}
                  title={selectedContent.title}
                  startAt={selectedContent.lastPositionSeconds}
                  onProgress={(percent, time) => handleProgress(selectedContent.id, percent, time)}
                  onComplete={() => handleComplete(selectedContent.id)}
                />
              )}

              {selectedContent.contentType === "document" && selectedContent.storageUrl && (
                <iframe
                  src={selectedContent.storageUrl}
                  className="h-[70vh] w-full border-0"
                  title={selectedContent.title}
                />
              )}

              {selectedContent.contentType === "audio" && selectedContent.storageUrl && (
                <div className="flex items-center justify-center py-12">
                  <audio src={selectedContent.storageUrl} controls className="w-full max-w-md" />
                </div>
              )}

              {selectedContent.contentType === "image" && selectedContent.storageUrl && (
                <div className="flex items-center justify-center">
                  <img
                    src={selectedContent.storageUrl}
                    alt={selectedContent.title}
                    className="max-h-[70vh] max-w-full object-contain"
                  />
                </div>
              )}

              {/* Description */}
              {selectedContent.description && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-content-muted">{selectedContent.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(newContent: ContentItem) => {
          // Add new content to list if it's ready
          if (newContent.status === "ready") {
            setContent((prev) => [
              {
                ...newContent,
                progressPercent: 0,
                lastPositionSeconds: 0,
                isCompleted: false,
                isBookmarked: false,
              },
              ...prev,
            ]);
            setTotal((t) => t + 1);
          }
        }}
      />
    </div>
  );
}
