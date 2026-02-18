"use client";

import { FC, useState, useEffect, useRef, useCallback, ChangeEvent } from "react";

import Image from "next/image";

import { cn } from "@lib/utils/style";
import { PostType, PostVisibility, POST_TYPE_LABELS } from "@resources/types/community";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    postType: PostType;
    title?: string;
    content: string;
    visibility: PostVisibility;
    mediaUrls?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  userImage?: string | null;
  userName?: string;
}

const CreatePostModal: FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userImage,
  userName,
}) => {
  const [postType, setPostType] = useState<PostType>("win");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("cohort");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when modal opens
    firstFocusableRef.current?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePhotoSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files
        .filter((f) => f.size <= 5 * 1024 * 1024 && f.type.startsWith("image/"))
        .slice(0, 4 - mediaFiles.length);

      if (validFiles.length === 0) return;

      setMediaFiles((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setMediaPreview((prev) => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    },
    [mediaFiles.length]
  );

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please write something to share!");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let mediaUrls: string[] | undefined;

    // Upload media files if any
    if (mediaFiles.length > 0) {
      try {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("files", file));

        const uploadResponse = await fetch("/api/community/media", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          setIsSubmitting(false);
          setError(uploadData.error || "Failed to upload images");
          return;
        }

        mediaUrls = uploadData.urls;
      } catch {
        setIsSubmitting(false);
        setError("Failed to upload images. Please try again.");
        return;
      }
    }

    const result = await onSubmit({
      postType,
      title: title.trim() || undefined,
      content: content.trim(),
      visibility,
      mediaUrls,
    });

    setIsSubmitting(false);

    if (result.success) {
      setTitle("");
      setContent("");
      setPostType("win");
      setMediaFiles([]);
      setMediaPreview([]);
      onClose();
    } else {
      setError(result.error || "Failed to create post");
    }
  };

  if (!isOpen) return null;

  const postTypeLabel = POST_TYPE_LABELS[postType]?.label || "Post";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        className="rounded-large bg-bkg-light relative w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="border-border-light flex items-center justify-between border-b px-6 py-4">
          <h2 id="create-post-title" className="text-content-dark text-xl font-bold">
            Share Your {postTypeLabel}
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close modal"
            className="text-grey-500 hover:bg-grey-100 hover:text-content-dark-secondary focus-visible:ring-action min-h-[44px] min-w-[44px] rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* User Info */}
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-grey-100 relative h-12 w-12 overflow-hidden rounded-full">
              {userImage ? (
                <Image src={userImage} alt={userName || "You"} fill className="object-cover" />
              ) : (
                <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-lg font-semibold">
                  {userName?.[0] || "Y"}
                </div>
              )}
            </div>
            <div>
              <p className="text-content-dark font-semibold">{userName || "You"}</p>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                aria-label="Post visibility"
                className="bg-grey-100 text-grey-500 focus:ring-action min-h-[44px] rounded border-none px-2 py-1 text-xs focus:ring-2 focus-visible:outline-none"
              >
                <option value="cohort">Cohort Only</option>
                <option value="public">Public</option>
                <option value="private">Only Me</option>
              </select>
            </div>
          </div>

          {/* Post Type Selector */}
          <fieldset className="m-0 mb-4 flex flex-wrap gap-2 border-none p-0">
            <legend className="sr-only">Select post type</legend>
            {(
              Object.entries(POST_TYPE_LABELS) as [PostType, { label: string; color: string }][]
            ).map(([type, info]) => (
              <button
                key={type}
                onClick={() => setPostType(type)}
                aria-pressed={postType === type}
                className={cn(
                  "focus-visible:ring-action flex min-h-[44px] items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  postType === type
                    ? "bg-action-50 text-action-600"
                    : "bg-grey-100 text-grey-500 hover:bg-grey-200"
                )}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span>{info.label}</span>
              </button>
            ))}
          </fieldset>

          {/* Title (optional) */}
          <input
            type="text"
            placeholder="Add a title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Post title (optional)"
            className="border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-400 focus:border-action focus:ring-action/20 mb-3 w-full rounded border px-4 py-2 text-lg font-semibold focus:ring-2 focus:outline-none"
          />

          {/* Content */}
          <textarea
            placeholder={getPlaceholder(postType)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            aria-label="Post content"
            aria-required="true"
            className="border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-400 focus:border-action focus:ring-action/20 mb-4 w-full resize-none rounded border px-4 py-3 focus:ring-2 focus:outline-none"
          />

          {/* Media Preview */}
          {mediaPreview.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {mediaPreview.map((preview, index) => (
                <div
                  key={preview}
                  className="bg-grey-100 relative aspect-video overflow-hidden rounded"
                >
                  <Image
                    src={preview}
                    alt={`Upload preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeMedia(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="focus-visible:ring-action absolute top-2 right-2 min-h-[44px] min-w-[44px] rounded-full bg-black/60 p-1 text-white hover:bg-black/80 focus-visible:ring-2 focus-visible:outline-none"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-danger/10 text-danger mb-4 rounded px-4 py-2 text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Prompts */}
          <div className="from-primary/20 to-primary-500/20 mb-4 rounded bg-gradient-to-r p-4">
            <p className="text-primary text-sm font-medium">Need inspiration?</p>
            <ul className="text-primary/80 mt-2 space-y-1 text-sm">
              {getPrompts(postType).map((prompt) => (
                <li key={prompt} className="flex items-start gap-2">
                  <span className="text-primary/60">•</span>
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-border-light bg-bkg-light-secondary flex items-center justify-between border-t px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
              aria-label="Upload photos"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= 4}
              aria-label={mediaFiles.length >= 4 ? "Maximum 4 photos allowed" : "Add photo"}
              className={cn(
                "focus-visible:ring-action min-h-[44px] min-w-[44px] rounded p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                mediaFiles.length >= 4
                  ? "text-grey-600 cursor-not-allowed"
                  : "text-grey-500 hover:bg-grey-100"
              )}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            <span className="text-grey-500 text-xs">
              {mediaFiles.length > 0 ? `${mediaFiles.length}/4 photos` : "Add photo"}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className={cn(
              "focus-visible:ring-action min-h-[44px] rounded px-6 py-2 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              isSubmitting || !content.trim()
                ? "bg-bkg-disabled/20 text-grey-600 cursor-not-allowed"
                : "bg-action text-content-dark hover:bg-action-100 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Posting...
              </span>
            ) : (
              "Share"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function getPlaceholder(postType: PostType): string {
  switch (postType) {
    case "win":
      return "What win are you celebrating today? Share your achievement with the community!";
    case "reflection":
      return "Share a moment of gratitude or reflection from your journey...";
    case "encouragement":
      return "Send some encouragement to your community...";
    case "question":
      return "What would you like to ask the community?";
    case "celebration":
      return "Who or what would you like to celebrate today?";
    default:
      return "What's on your mind?";
  }
}

function getPrompts(postType: PostType): string[] {
  switch (postType) {
    case "win":
      return [
        "I completed my morning journal for 7 days straight!",
        "Today I practiced gratitude even when it was hard",
        "I helped a friend start their own gratitude practice",
      ];
    case "reflection":
      return [
        "I'm grateful for the small moments of peace today",
        "This challenge taught me that consistency beats perfection",
        "Looking back, I can see how much I've grown",
      ];
    case "encouragement":
      return [
        "Keep going - every day you show up is a victory!",
        "Your journey inspires others, even when you don't see it",
        "Remember: progress, not perfection",
      ];
    default:
      return [
        "Share what's on your heart today",
        "Connect with your community",
        "Celebrate the small wins",
      ];
  }
}

export default CreatePostModal;
