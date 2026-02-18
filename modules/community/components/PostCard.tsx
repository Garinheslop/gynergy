"use client";

import { FC, useState, useRef, useEffect } from "react";

import Image from "next/image";

import { usePopup } from "@contexts/UsePopup";
import { formatTimeAgo } from "@lib/utils/date";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import { Avatar } from "@modules/common/components/ui";
import { useConfirm } from "@modules/common/components/ui/ConfirmDialog";
import {
  CommunityPost,
  ReactionType,
  REACTION_ICONS,
  POST_TYPE_LABELS,
} from "@resources/types/community";
import { RootState } from "@store/configureStore";
import { useSelector, useDispatch } from "@store/hooks";
import {
  toggleExpandComments,
  incrementShareCount,
  editPost,
  deletePost,
} from "@store/modules/community";

import BlockUserButton from "./BlockUserButton";
import CommentSection from "./CommentSection";
import ReactionIcon from "./ReactionIcon";
import ReportModal from "./ReportModal";

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onReact: (postId: string, reactionType: ReactionType) => void;
}

const PostCard: FC<PostCardProps> = ({ post, currentUserId, onReact }) => {
  const dispatch = useDispatch();
  const { messagePopupObj } = usePopup();
  const [showReactions, setShowReactions] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const ownerMenuRef = useRef<HTMLDivElement>(null);
  const { confirm, Dialog: DeleteDialog } = useConfirm({
    variant: "danger",
  });

  const isOwner = currentUserId === post.userId;

  // Close reaction picker on outside click/touch
  useEffect(() => {
    if (!showReactions) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showReactions]);

  // Close owner menu on outside click/touch
  useEffect(() => {
    if (!showOwnerMenu) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target as Node)) {
        setShowOwnerMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showOwnerMenu]);

  // Handle edit save
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setEditSaving(true);
    const result = await dispatch(editPost(post.id, { title: editTitle, content: editContent }));
    setEditSaving(false);
    if (result.success) {
      setIsEditing(false);
      messagePopupObj.open({ popupData: "Post updated!", popupType: "success" });
      triggerHaptic("success");
    } else {
      messagePopupObj.open({ popupData: result.error || "Failed to update", popupType: "error" });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Post",
      message:
        "This action cannot be undone. All comments and reactions on this post will also be deleted.",
      confirmLabel: "Delete",
      cancelLabel: "Keep Post",
    });
    if (!confirmed) return;

    const result = await dispatch(deletePost(post.id));
    if (result.success) {
      messagePopupObj.open({ popupData: "Post deleted", popupType: "success" });
      triggerHaptic("medium");
    } else {
      messagePopupObj.open({ popupData: result.error || "Failed to delete", popupType: "error" });
    }
  };

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
        dispatch(incrementShareCount(post.id));
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        messagePopupObj.open({ popupData: "Link copied to clipboard!", popupType: "success" });
        dispatch(incrementShareCount(post.id));
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

  const formatDate = (dateString: string) => formatTimeAgo(dateString);

  const postTypeInfo = POST_TYPE_LABELS[post.postType];

  return (
    <article className="border-border-light bg-bkg-light rounded border p-5 transition-shadow hover:shadow-md">
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
              <span className="text-content-dark font-semibold">
                {post.author?.firstName} {post.author?.lastName}
              </span>
              {post.isPinned && (
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs font-medium">
                  Pinned
                </span>
              )}
              {post.isFeatured && (
                <span className="bg-action-50 text-action-700 rounded px-2 py-0.5 text-xs font-medium">
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

        {/* Post Options Menu */}
        {currentUserId && !isEditing && (
          <div className="relative" ref={ownerMenuRef}>
            <button
              aria-label="Post options"
              aria-expanded={showOwnerMenu}
              className="text-grey-500 hover:text-content-dark hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => setShowOwnerMenu(!showOwnerMenu)}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showOwnerMenu && (
              <div className="border-border-light bg-bkg-light absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border shadow-lg">
                {isOwner ? (
                  <>
                    <button
                      className="text-content-dark hover:bg-grey-100 focus-visible:ring-action flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      onClick={() => {
                        setIsEditing(true);
                        setEditTitle(post.title || "");
                        setEditContent(post.content);
                        setShowOwnerMenu(false);
                      }}
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="text-danger hover:bg-danger/10 focus-visible:ring-action flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      onClick={() => {
                        setShowOwnerMenu(false);
                        handleDelete();
                      }}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="text-content-dark-secondary hover:bg-grey-100 focus-visible:ring-action flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      onClick={() => {
                        setShowOwnerMenu(false);
                        setShowReportModal(true);
                      }}
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
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                      Report
                    </button>
                    <BlockUserButton
                      userId={post.userId}
                      userName={post.author?.firstName || "this user"}
                      onBlocked={() => setShowOwnerMenu(false)}
                      variant="menu-item"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="mb-4 space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (optional)"
            className="border-border-light bg-bkg-light-secondary text-content-dark focus:border-action w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="border-border-light bg-bkg-light-secondary text-content-dark focus:border-action w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={editSaving || !editContent.trim()}
              className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[44px] rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              {editSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={editSaving}
              className="text-grey-500 hover:text-content-dark focus-visible:ring-action min-h-[44px] rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Title */}
          {post.title && (
            <h3 className="text-content-dark mb-2 text-lg font-semibold">{post.title}</h3>
          )}

          {/* Content */}
          <p className="text-content-dark-secondary mb-4 whitespace-pre-wrap">{post.content}</p>
        </>
      )}

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
                "bg-grey-100 relative aspect-video overflow-hidden rounded",
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
          <span className="flex items-center gap-1.5">
            <span className="flex items-center">
              {(Object.keys(REACTION_ICONS) as ReactionType[]).slice(0, 3).map((type) => (
                <span key={type} className="-ml-0.5 first:ml-0">
                  <ReactionIcon type={type} size="sm" />
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
        <div className="relative" ref={reactionPickerRef}>
          <button
            aria-label={post.userReaction ? `Remove ${post.userReaction} reaction` : "Add reaction"}
            aria-pressed={!!post.userReaction}
            aria-expanded={showReactions}
            className={cn(
              "focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              post.userReaction ? "bg-action-50 text-action-600" : "text-grey-500 hover:bg-grey-100"
            )}
            onClick={() => {
              if (post.userReaction) {
                onReact(post.id, post.userReaction);
              } else {
                setShowReactions(!showReactions);
              }
            }}
          >
            {post.userReaction ? (
              <ReactionIcon type={post.userReaction} size="md" />
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
            <span>{post.userReaction ? REACTION_ICONS[post.userReaction].label : "React"}</span>
          </button>

          {/* Reaction Picker */}
          {showReactions && (
            <fieldset className="border-border-light bg-bkg-light absolute bottom-full left-0 m-0 mb-2 flex gap-1 rounded-full border p-2 shadow-lg">
              <legend className="sr-only">Choose a reaction</legend>
              {(Object.keys(REACTION_ICONS) as ReactionType[]).map((type) => (
                <button
                  key={type}
                  aria-label={`React with ${REACTION_ICONS[type].label}`}
                  aria-pressed={post.userReaction === type}
                  title={REACTION_ICONS[type].label}
                  className={cn(
                    "hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:outline-none",
                    post.userReaction === type && "bg-action-50"
                  )}
                  onClick={() => {
                    onReact(post.id, type);
                    setShowReactions(false);
                    triggerHaptic("light");
                  }}
                >
                  <ReactionIcon type={type} size="lg" />
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
            isCommentsExpanded ? "bg-action-50 text-action-600" : "text-grey-500 hover:bg-grey-100"
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
          className="text-grey-500 hover:bg-grey-100 focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
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

      {/* Delete Confirmation Dialog */}
      <DeleteDialog />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="post"
        contentId={post.id}
      />
    </article>
  );
};

export default PostCard;
