"use client";

import { FC, useEffect, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { formatTimeAgo } from "@lib/utils/date";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import { Avatar } from "@modules/common/components/ui";
import CommentSection from "@modules/community/components/CommentSection";
import ReactionIcon from "@modules/community/components/ReactionIcon";
import {
  CommunityPost,
  ReactionType,
  REACTION_ICONS,
  POST_TYPE_LABELS,
} from "@resources/types/community";
import { useDispatch } from "@store/hooks";
import { toggleReaction, toggleExpandComments } from "@store/modules/community";

const PostDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { session, authenticating } = useSession();
  const { messagePopupObj } = usePopup();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const postId = params.id as string;

  // Redirect if not logged in
  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
    }
  }, [session, authenticating, router]);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/community/feed?postId=${postId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch post");
        }

        setPost(data.post);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Post not found";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchPost();
    }
  }, [postId, session?.user]);

  const handleReaction = (reactionType: ReactionType) => {
    if (!post) return;
    dispatch(toggleReaction(post.id, reactionType));

    // Update local state optimistically
    const hadReaction = !!post.userReaction;
    const sameReaction = post.userReaction === reactionType;

    setPost((prev) => {
      if (!prev) return prev;
      if (sameReaction) {
        return { ...prev, userReaction: null, reactionCount: Math.max(0, prev.reactionCount - 1) };
      } else if (hadReaction) {
        return { ...prev, userReaction: reactionType };
      } else {
        return { ...prev, userReaction: reactionType, reactionCount: prev.reactionCount + 1 };
      }
    });
    setShowReactions(false);
  };

  const handleShare = async () => {
    if (!post) return;

    const shareUrl = globalThis.location.href;
    try {
      if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
        await navigator.share({
          title:
            post.title || `${post.author?.firstName}'s ${POST_TYPE_LABELS[post.postType].label}`,
          text: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          url: shareUrl,
        });
        triggerHaptic("success");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        messagePopupObj.open({ popupData: "Link copied to clipboard!", popupType: "success" });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          messagePopupObj.open({ popupData: "Link copied to clipboard!", popupType: "success" });
        } catch {
          messagePopupObj.open({ popupData: "Failed to share", popupType: "error" });
        }
      }
    }
  };

  const formatDate = (dateString: string) => formatTimeAgo(dateString);

  if (authenticating || isLoading) {
    return (
      <div className="bg-bkg-light-secondary min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-grey-100 mb-6 h-5 w-40 rounded" />
            <div className="border-border-light bg-bkg-light rounded border p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-grey-100 h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <div className="bg-grey-100 h-4 w-32 rounded" />
                  <div className="bg-grey-100 h-3 w-24 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-grey-100 h-4 w-full rounded" />
                <div className="bg-grey-100 h-4 w-3/4 rounded" />
                <div className="bg-grey-100 h-4 w-1/2 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-bkg-light-secondary min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="border-danger/30 bg-danger/10 rounded border p-6 text-center">
            <div className="bg-danger/20 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <svg
                className="text-danger h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-danger mt-4">{error || "Post not found"}</p>
            <Link
              href="/community"
              className="text-action-600 hover:text-action-700 mt-4 inline-block font-medium"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const postTypeInfo = POST_TYPE_LABELS[post.postType];

  return (
    <div className="bg-bkg-light-secondary min-h-screen">
      {/* Back Navigation */}
      <div className="border-border-light bg-bkg-light border-b">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/community"
            className="text-grey-500 hover:text-content-dark inline-flex items-center gap-2 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Community
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <article className="border-border-light bg-bkg-light rounded border p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={post.author?.profileImage}
                name={`${post.author?.firstName || ""} ${post.author?.lastName || ""}`}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-content-dark font-semibold">
                    {post.author?.firstName} {post.author?.lastName}
                  </span>
                  {post.isPinned && (
                    <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs font-medium">
                      Pinned
                    </span>
                  )}
                  {post.isFeatured && (
                    <span className="bg-action-50 text-action-600 rounded px-2 py-0.5 text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <div className="text-grey-500 flex items-center gap-2 text-sm">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: postTypeInfo.color }}
                    />
                    <span>{postTypeInfo.label}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          {post.title && <h1 className="text-content-dark mb-3 text-xl font-bold">{post.title}</h1>}

          {/* Content */}
          <p className="text-content-dark-secondary mb-6 text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={cn(
                "mb-6 grid gap-2",
                post.mediaUrls.length === 1 && "grid-cols-1",
                post.mediaUrls.length === 2 && "grid-cols-2",
                post.mediaUrls.length >= 3 && "grid-cols-2 sm:grid-cols-3"
              )}
            >
              {post.mediaUrls.map((url, index) => (
                <div
                  key={url}
                  className={cn(
                    "bg-grey-100 relative aspect-video overflow-hidden rounded",
                    post.mediaUrls.length === 1 && "max-h-[500px]"
                  )}
                >
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="text-grey-500 mb-3 flex items-center gap-4 text-sm">
            {post.reactionCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="flex items-center">
                  {Object.keys(REACTION_ICONS)
                    .slice(0, 3)
                    .map((type) => (
                      <span key={type} className="-ml-1 first:ml-0">
                        <ReactionIcon type={type as ReactionType} size="sm" colored />
                      </span>
                    ))}
                </span>
                <span>{post.reactionCount}</span>
              </span>
            )}
            {post.commentCount > 0 && <span>{post.commentCount} comments</span>}
            {post.shareCount > 0 && <span>{post.shareCount} shares</span>}
          </div>

          {/* Actions */}
          <div className="border-border-light flex items-center gap-1 border-t pt-3">
            {/* Reaction Button */}
            <div className="relative">
              <button
                aria-label={
                  post.userReaction ? `Remove ${post.userReaction} reaction` : "Add reaction"
                }
                aria-pressed={!!post.userReaction}
                className={cn(
                  "focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  post.userReaction
                    ? "bg-action-50 text-action-600"
                    : "text-grey-500 hover:bg-grey-100"
                )}
                onClick={() => {
                  if (post.userReaction) {
                    handleReaction(post.userReaction);
                  } else {
                    setShowReactions(!showReactions);
                  }
                }}
              >
                {post.userReaction ? (
                  <ReactionIcon type={post.userReaction} size="md" colored />
                ) : (
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
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                )}
                <span>{post.userReaction ? "Reacted" : "React"}</span>
              </button>

              {showReactions && (
                <fieldset className="border-border-light bg-bkg-light absolute bottom-full left-0 m-0 mb-2 flex gap-1 rounded-full border p-2 shadow-lg">
                  <legend className="sr-only">Choose a reaction</legend>
                  {Object.keys(REACTION_ICONS).map((type) => (
                    <button
                      key={type}
                      aria-label={`React with ${type}`}
                      aria-pressed={post.userReaction === type}
                      className={cn(
                        "hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:outline-none",
                        post.userReaction === type && "bg-action-50"
                      )}
                      onClick={() => handleReaction(type as ReactionType)}
                    >
                      <ReactionIcon type={type as ReactionType} size="md" colored />
                    </button>
                  ))}
                </fieldset>
              )}
            </div>

            {/* Comment Button */}
            <button
              aria-label={`Comment on post, ${post.commentCount} comments`}
              className="text-grey-500 hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => dispatch(toggleExpandComments(post.id))}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Comment{post.commentCount > 0 ? ` (${post.commentCount})` : ""}</span>
            </button>

            {/* Share Button */}
            <button
              aria-label="Share post"
              className="text-grey-500 hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={handleShare}
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>
          </div>

          {/* Comments -- always expanded on detail page */}
          <CommentSection postId={post.id} isExpanded={true} onToggle={() => {}} />
        </article>
      </div>
    </div>
  );
};

export default PostDetailPage;
