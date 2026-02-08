"use client";

import { FC, useState, useEffect, useRef } from "react";

import Image from "next/image";

import { Comment } from "@resources/types/community";
import { RootState } from "@store/configureStore";
import { useSelector, useDispatch } from "@store/hooks";
import { fetchComments, createComment, deleteComment } from "@store/modules/community";

interface CommentSectionProps {
  postId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const CommentSection: FC<CommentSectionProps> = ({ postId, isExpanded, onToggle: _onToggle }) => {
  const dispatch = useDispatch();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const comments = useSelector((state: RootState) => state.community.comments[postId] || []);
  const isLoading = useSelector(
    (state: RootState) => state.community.commentsLoading[postId] || false
  );
  const profile = useSelector((state: RootState) => state.profile.current);

  // Fetch comments when expanded
  useEffect(() => {
    if (isExpanded && comments.length === 0 && !isLoading) {
      dispatch(fetchComments(postId) as any);
    }
  }, [isExpanded, postId, comments.length, isLoading, dispatch]);

  // Focus reply input when replying
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await dispatch(createComment(postId, newComment.trim()) as any);
    setIsSubmitting(false);

    if (result.success) {
      setNewComment("");
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await dispatch(createComment(postId, replyContent.trim(), parentId) as any);
    setIsSubmitting(false);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await dispatch(deleteComment(postId, commentId) as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="border-border-dark mt-4 border-t pt-4">
      {/* Comment Input */}
      <div className="mb-4 flex gap-3">
        <div className="bg-bkg-dark-800 relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
          {profile?.profileImage ? (
            <Image
              src={profile.profileImage}
              alt={profile.firstName || "You"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-xs font-semibold">
              {profile?.firstName?.[0] || "Y"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={1}
            aria-label="Write a comment"
            className="border-border-dark bg-bkg-dark text-content-light placeholder:text-grey-600 focus:border-action focus:ring-action w-full resize-none rounded border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          {newComment.trim() && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting}
                className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[32px] rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && comments.length === 0 && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="bg-bkg-dark-800 h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-bkg-dark-800 h-3 w-24 rounded" />
                <div className="bg-bkg-dark-800 h-4 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length === 0 && (
        <p className="text-grey-500 py-4 text-center text-sm">
          No comments yet. Be the first to comment!
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUserId={profile?.id}
            onReply={(commentId) => {
              setReplyingTo(replyingTo === commentId ? null : commentId);
              setReplyContent("");
            }}
            onDelete={handleDeleteComment}
            formatDate={formatDate}
            replyingTo={replyingTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            onSubmitReply={handleSubmitReply}
            isSubmitting={isSubmitting}
            replyInputRef={replyInputRef}
          />
        ))}
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  formatDate: (dateString: string) => string;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  isSubmitting: boolean;
  replyInputRef: React.RefObject<HTMLTextAreaElement>;
}

const CommentItem: FC<CommentItemProps> = ({
  comment,
  postId: _postId,
  currentUserId,
  onReply,
  onDelete,
  formatDate,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  replyInputRef,
}) => {
  const isOwner = currentUserId === comment.userId;
  const isReplying = replyingTo === comment.id;

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="bg-bkg-dark-800 relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
          {comment.author?.profileImage ? (
            <Image
              src={comment.author.profileImage}
              alt={comment.author.firstName || "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-xs font-semibold">
              {comment.author?.firstName?.[0] || "?"}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="bg-bkg-dark-800 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-content-light text-sm font-semibold">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-grey-500 text-xs">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-grey-300 mt-1 text-sm break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-1 flex items-center gap-4">
            <button
              onClick={() => onReply(comment.id)}
              className="text-grey-500 hover:text-action focus-visible:text-action text-xs font-medium focus-visible:outline-none"
            >
              Reply
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-grey-500 hover:text-danger focus-visible:text-danger text-xs font-medium focus-visible:outline-none"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-2 flex gap-2">
              <textarea
                ref={replyInputRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author?.firstName}...`}
                rows={1}
                aria-label={`Reply to ${comment.author?.firstName}`}
                className="border-border-dark bg-bkg-dark text-content-light placeholder:text-grey-600 focus:border-action focus:ring-action flex-1 resize-none rounded border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitReply(comment.id);
                  }
                  if (e.key === "Escape") {
                    onReply(comment.id); // Toggle off
                  }
                }}
              />
              <button
                onClick={() => onSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
                className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[32px] rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-border-dark mt-3 space-y-3 border-l-2 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <div className="bg-bkg-dark-800 relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                    {reply.author?.profileImage ? (
                      <Image
                        src={reply.author.profileImage}
                        alt={reply.author.firstName || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-[10px] font-semibold">
                        {reply.author?.firstName?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="bg-bkg-dark-800 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-content-light text-xs font-semibold">
                          {reply.author?.firstName} {reply.author?.lastName}
                        </span>
                        <span className="text-grey-500 text-xs">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-grey-300 mt-1 text-xs break-words whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                    {currentUserId === reply.userId && (
                      <button
                        onClick={() => onDelete(reply.id)}
                        className="text-grey-500 hover:text-danger focus-visible:text-danger mt-1 text-xs font-medium focus-visible:outline-none"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
