"use client";

import { FC, useState } from "react";

import Image from "next/image";

import { usePopup } from "@contexts/UsePopup";
import { Avatar } from "@modules/common/components/ui";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import {
  CommunityPost,
  ReactionType,
  REACTION_EMOJIS,
  POST_TYPE_LABELS,
} from "@resources/types/community";
import { RootState } from "@store/configureStore";
import { useSelector, useDispatch } from "@store/hooks";
import { toggleExpandComments, incrementShareCount } from "@store/modules/community";

import CommentSection from "./CommentSection";

interface PostCardProps {
  post: CommunityPost;
  onReact: (postId: string, reactionType: ReactionType) => void;
}

const PostCard: FC<PostCardProps> = ({ post, onReact }) => {
  const dispatch = useDispatch();
  const { messagePopupObj } = usePopup();
  const [showReactions, setShowReactions] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const expandedComments = useSelector((state: RootState) => state.community.expandedComments);
  const isCommentsExpanded = expandedComments.includes(post.id);

  const handleToggleComments = () => {
    dispatch(toggleExpandComments(post.id));
  };

  const handleShare = async () => {
    setShareLoading(true);

    const shareUrl = `${globalThis.location.origin}/community/post/${post.id}`;
    const shareData = {
      title: post.title || `${post.author?.firstName}'s ${POST_TYPE_LABELS[post.postType].label}`,
      text: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
      url: shareUrl,
    };

    try {
      // Try native share API first (mobile)
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        triggerHaptic("success");
        dispatch(incrementShareCount(post.id) as any);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        messagePopupObj.open({ popupData: "Link copied to clipboard!", popupType: "success" });
        dispatch(incrementShareCount(post.id) as any);
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareUrl);
          messagePopupObj.open({ popupData: "Link copied to clipboard!", popupType: "success" });
        } catch {
          messagePopupObj.open({ popupData: "Failed to share", popupType: "error" });
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const postTypeInfo = POST_TYPE_LABELS[post.postType];

  return (
    <article className="border-border-dark bg-bkg-dark-secondary rounded border p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar
            src={post.author?.profileImage}
            name={`${post.author?.firstName || ""} ${post.author?.lastName || ""}`}
            size="lg"
          />

          {/* Name & Time */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-content-light font-semibold">
                {post.author?.firstName} {post.author?.lastName}
              </span>
              {post.isPinned && (
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs font-medium">
                  Pinned
                </span>
              )}
              {post.isFeatured && (
                <span className="bg-action/20 text-action rounded px-2 py-0.5 text-xs font-medium">
                  Featured
                </span>
              )}
            </div>
            <div className="text-grey-500 flex items-center gap-2 text-sm">
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span>{postTypeInfo.emoji}</span>
                <span>{postTypeInfo.label}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-content-light mb-2 text-lg font-semibold">{post.title}</h3>
      )}

      {/* Content */}
      <p className="text-grey-300 mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div
          className={cn(
            "mb-4 grid gap-2",
            post.mediaUrls.length === 1 && "grid-cols-1",
            post.mediaUrls.length === 2 && "grid-cols-2",
            post.mediaUrls.length >= 3 && "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {post.mediaUrls.slice(0, 4).map((url, index) => (
            <div
              key={url}
              className={cn(
                "bg-bkg-dark-800 relative aspect-video overflow-hidden rounded",
                post.mediaUrls.length === 1 && "max-h-96"
              )}
            >
              <Image src={url} alt={`Media ${index + 1}`} fill className="object-cover" />
              {index === 3 && post.mediaUrls.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
                  +{post.mediaUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="text-grey-500 mb-3 flex items-center gap-4 text-sm">
        {post.reactionCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="flex">
              {Object.entries(REACTION_EMOJIS)
                .slice(0, 3)
                .map(([_, emoji]) => (
                  <span key={emoji} className="-ml-1 first:ml-0">
                    {emoji}
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
      <div className="border-border-dark flex items-center gap-1 border-t pt-3">
        {/* Reaction Button */}
        <div className="relative">
          <button
            aria-label={post.userReaction ? `Remove ${post.userReaction} reaction` : "Add reaction"}
            aria-pressed={!!post.userReaction}
            className={cn(
              "focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              post.userReaction ? "bg-action/20 text-action" : "text-grey-400 hover:bg-bkg-dark-800"
            )}
            onClick={() => {
              if (post.userReaction) {
                onReact(post.id, post.userReaction);
              } else {
                setShowReactions(!showReactions);
              }
            }}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
          >
            <span className="text-lg">
              {post.userReaction ? REACTION_EMOJIS[post.userReaction] : "👍"}
            </span>
            <span>{post.userReaction ? "Reacted" : "React"}</span>
          </button>

          {/* Reaction Picker */}
          {showReactions && (
            <fieldset
              className="border-border-dark bg-bkg-dark-secondary absolute bottom-full left-0 m-0 mb-2 flex gap-1 rounded-full border p-2 shadow-lg"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              <legend className="sr-only">Choose a reaction</legend>
              {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                <button
                  key={type}
                  aria-label={`React with ${type}`}
                  aria-pressed={post.userReaction === type}
                  className={cn(
                    "hover:bg-bkg-dark-800 focus-visible:ring-action min-h-[44px] min-w-[44px] rounded-full p-2 text-xl transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:outline-none",
                    post.userReaction === type && "bg-action/20"
                  )}
                  onClick={() => {
                    onReact(post.id, type as ReactionType);
                    setShowReactions(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </fieldset>
          )}
        </div>

        {/* Comment Button */}
        <button
          aria-label={`Comment on post, ${post.commentCount} comments`}
          aria-expanded={isCommentsExpanded}
          className={cn(
            "focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            isCommentsExpanded ? "bg-action/20 text-action" : "text-grey-400 hover:bg-bkg-dark-800"
          )}
          onClick={handleToggleComments}
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
          disabled={shareLoading}
          className="text-grey-400 hover:bg-bkg-dark-800 focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
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
          <span>{shareLoading ? "Sharing..." : "Share"}</span>
        </button>
      </div>

      {/* Comment Section */}
      <CommentSection
        postId={post.id}
        isExpanded={isCommentsExpanded}
        onToggle={handleToggleComments}
      />
    </article>
  );
};

export default PostCard;
