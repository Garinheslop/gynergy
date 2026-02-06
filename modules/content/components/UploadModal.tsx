"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

import { cn } from "@lib/utils/style";
import { ContentType, ContentVisibility, ContentItem } from "@resources/types/content";

// =============================================================================
// TYPES
// =============================================================================

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (content: ContentItem) => void;
  cohortId?: string; // Optional: if uploading for a specific cohort
}

interface UploadState {
  file: File | null;
  title: string;
  description: string;
  contentType: ContentType;
  visibility: ContentVisibility;
  tags: string[];
  tagInput: string;
}

type UploadPhase = "idle" | "uploading" | "processing" | "complete" | "error";

// =============================================================================
// HELPERS
// =============================================================================

const getContentTypeFromMime = (mimeType: string): ContentType | null => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("text/") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const ACCEPTED_TYPES: Record<ContentType, string[]> = {
  video: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

const MAX_FILE_SIZES: Record<ContentType, number> = {
  video: 5 * 1024 * 1024 * 1024, // 5GB for video
  audio: 500 * 1024 * 1024, // 500MB for audio
  image: 50 * 1024 * 1024, // 50MB for images
  document: 100 * 1024 * 1024, // 100MB for documents
};

// =============================================================================
// COMPONENT
// =============================================================================

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess, cohortId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>({
    file: null,
    title: "",
    description: "",
    contentType: "video",
    visibility: "private",
    tags: [],
    tagInput: "",
  });

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<ContentItem | null>(null);

  // Poll for video processing status
  const processingPollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
      }
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        file: null,
        title: "",
        description: "",
        contentType: "video",
        visibility: "private",
        tags: [],
        tagInput: "",
      });
      setPhase("idle");
      setProgress(0);
      setError(null);
      setUploadedContent(null);
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
      }
    }
  }, [isOpen]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const contentType = getContentTypeFromMime(file.type);

    if (!contentType) {
      setError("Unsupported file type. Please upload a video, audio, image, or document file.");
      return;
    }

    if (file.size > MAX_FILE_SIZES[contentType]) {
      setError(
        `File too large. Maximum size for ${contentType} is ${formatFileSize(MAX_FILE_SIZES[contentType])}`
      );
      return;
    }

    setError(null);
    setState((prev) => ({
      ...prev,
      file,
      contentType,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as default title
    }));
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAddTag = () => {
    const tag = state.tagInput.trim().toLowerCase();
    if (tag && !state.tags.includes(tag)) {
      setState((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setState((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const pollVideoStatus = async (contentId: string) => {
    processingPollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/content/get-video-status?contentId=${contentId}`);
        const data = await response.json();

        setProgress(data.progress || 0);
        setProgressMessage(data.message || "Processing...");

        if (data.status === "ready") {
          clearInterval(processingPollRef.current!);
          setPhase("complete");
          setProgress(100);
          setProgressMessage("Upload complete!");

          // Fetch updated content
          const contentResponse = await fetch(`/api/content/get-content?contentId=${contentId}`);
          const contentData = await contentResponse.json();
          setUploadedContent(contentData);
        } else if (data.status === "error") {
          clearInterval(processingPollRef.current!);
          setPhase("error");
          setError(data.message || "Video processing failed");
        }
      } catch (err) {
        console.error("Error polling video status:", err);
      }
    }, 3000);
  };

  const handleUpload = async () => {
    if (!state.file || !state.title.trim()) {
      setError("Please select a file and enter a title");
      return;
    }

    setError(null);
    setPhase("uploading");
    setProgress(0);
    setProgressMessage("Preparing upload...");

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("title", state.title.trim());
      formData.append("description", state.description.trim());
      formData.append("contentType", state.contentType);
      formData.append("visibility", state.visibility);
      formData.append("tags", JSON.stringify(state.tags));
      if (cohortId) {
        formData.append("cohortId", cohortId);
      }

      setProgressMessage("Uploading file...");

      // Upload with progress tracking using XMLHttpRequest
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<ContentItem>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
            setProgressMessage(`Uploading... ${percent}%`);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.content);
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", "/api/content/upload");
        xhr.send(formData);
      });

      const content = await uploadPromise;
      setUploadedContent(content);

      // For videos, we need to wait for processing
      if (state.contentType === "video") {
        setPhase("processing");
        setProgress(0);
        setProgressMessage("Processing video...");
        pollVideoStatus(content.id);
      } else {
        setPhase("complete");
        setProgress(100);
        setProgressMessage("Upload complete!");
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleComplete = () => {
    if (uploadedContent && onSuccess) {
      onSuccess(uploadedContent);
    }
    onClose();
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-content-dark text-xl font-semibold">
            {phase === "complete" ? "Upload Complete" : "Upload Content"}
          </h2>
          <button
            onClick={onClose}
            disabled={phase === "uploading" || phase === "processing"}
            className={cn(
              "rounded-full p-2 transition-colors",
              phase === "uploading" || phase === "processing"
                ? "cursor-not-allowed text-gray-300"
                : "text-content-muted hover:text-content-dark hover:bg-gray-100"
            )}
          >
            <i className="gng-x text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {(phase === "uploading" || phase === "processing") && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-content-muted text-sm">{progressMessage}</span>
                <span className="text-action text-sm font-medium">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="bg-action h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {phase === "processing" && (
                <p className="text-content-muted mt-2 text-xs">
                  Video processing may take a few minutes. You can close this modal and check back
                  later.
                </p>
              )}
            </div>
          )}

          {/* Complete State */}
          {phase === "complete" && uploadedContent && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <i className="gng-check text-3xl text-green-600" />
              </div>
              <h3 className="text-content-dark mb-2 text-lg font-semibold">
                {uploadedContent.title}
              </h3>
              <p className="text-content-muted mb-6">
                Your content has been uploaded successfully!
              </p>
              <button
                onClick={handleComplete}
                className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* File Selection */}
          {phase === "idle" && !state.file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                isDragging
                  ? "border-action bg-action/5"
                  : "hover:border-action border-gray-300 hover:bg-gray-50"
              )}
            >
              <i className="gng-upload mb-4 text-4xl text-gray-400" />
              <p className="text-content-dark mb-1 font-medium">Drag and drop your file here</p>
              <p className="text-content-muted mb-4 text-sm">or click to browse</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Video</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                  Document
                </span>
                <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                  Audio
                </span>
                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Image</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept={[
                  ...ACCEPTED_TYPES.video,
                  ...ACCEPTED_TYPES.audio,
                  ...ACCEPTED_TYPES.image,
                  ...ACCEPTED_TYPES.document,
                ].join(",")}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected - Form */}
          {phase === "idle" && state.file && (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    state.contentType === "video" && "bg-red-100 text-red-600",
                    state.contentType === "document" && "bg-blue-100 text-blue-600",
                    state.contentType === "audio" && "bg-purple-100 text-purple-600",
                    state.contentType === "image" && "bg-green-100 text-green-600"
                  )}
                >
                  <i
                    className={cn(
                      state.contentType === "video" && "gng-play-circle",
                      state.contentType === "document" && "gng-file-text",
                      state.contentType === "audio" && "gng-music",
                      state.contentType === "image" && "gng-image"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-content-dark truncate text-sm font-medium">
                    {state.file.name}
                  </p>
                  <p className="text-content-muted text-xs">
                    {formatFileSize(state.file.size)} • {state.contentType}
                  </p>
                </div>
                <button
                  onClick={() => setState((prev) => ({ ...prev, file: null, title: "" }))}
                  className="text-content-muted hover:text-content-dark rounded-full p-1.5 hover:bg-gray-200"
                >
                  <i className="gng-x" />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-content-dark mb-1 block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={state.title}
                  onChange={(e) => setState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for this content"
                  className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-content-dark mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={state.description}
                  onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a description (optional)"
                  rows={3}
                  className="border-border focus:ring-action/20 focus:border-action w-full resize-none rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="text-content-dark mb-1 block text-sm font-medium">
                  Visibility
                </label>
                <select
                  value={state.visibility}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      visibility: e.target.value as ContentVisibility,
                    }))
                  }
                  className="border-border focus:ring-action/20 focus:border-action w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
                >
                  <option value="private">Private - Only you can see</option>
                  <option value="cohort">Cohort - Visible to assigned cohorts</option>
                  <option value="unlisted">Unlisted - Anyone with link can view</option>
                  <option value="public">Public - Visible to all members</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="text-content-dark mb-1 block text-sm font-medium">Tags</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {state.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-content-dark inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-content-muted hover:text-content-dark"
                      >
                        <i className="gng-x text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state.tagInput}
                    onChange={(e) => setState((prev) => ({ ...prev, tagInput: e.target.value }))}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag"
                    className="border-border focus:ring-action/20 focus:border-action flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!state.tagInput.trim()}
                    className="text-content-dark rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === "idle" && state.file && (
          <div className="border-border flex items-center justify-end gap-3 border-t p-4">
            <button
              onClick={onClose}
              className="text-content-dark rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!state.title.trim()}
              className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload
            </button>
          </div>
        )}

        {phase === "processing" && (
          <div className="border-border border-t p-4">
            <button
              onClick={onClose}
              className="text-content-muted w-full rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
            >
              Close (processing will continue)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
