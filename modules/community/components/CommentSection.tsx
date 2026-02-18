"use client";

import { FC, useState, useEffect, useRef } from "react";

import { formatTimeAgo } from "@lib/utils/date";
import { Avatar } from "@modules/common/components/ui";
import { useConfirm } from "@modules/common/components/ui/ConfirmDialog";
import ReportModal from "@modules/community/components/ReportModal";
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
  const { confirm, Dialog } = useConfirm();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
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
      dispatch(fetchComments(postId));
    }
  }, [isExpanded, postId, comments.length, isLoading, dispatch]);

  // Focus reply input when replying
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submittingId) return;

    setSubmittingId("new");
    const result = await dispatch(createComment(postId, newComment.trim()));
    setSubmittingId(null);

    if (result.success) {
      setNewComment("");
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || submittingId) return;

    setSubmittingId(parentId);
    const result = await dispatch(createComment(postId, replyContent.trim(), parentId));
    setSubmittingId(null);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    await dispatch(deleteComment(postId, commentId));
  };

  const formatDate = (dateString: string) => formatTimeAgo(dateString, { compact: true });

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="border-border-light mt-4 border-t pt-4">
      <Dialog />
      {/* Comment Input */}
      <div className="mb-4 flex gap-3">
        <Avatar src={profile?.profileImage} name={profile?.firstName || "You"} size="sm" />
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={1}
            aria-label="Write a comment"
            className="border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-400 focus:border-action focus:ring-action w-full resize-none rounded border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
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
                disabled={submittingId === "new"}
                className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[44px] rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                {submittingId === "new" ? "Posting..." : "Post"}
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
              <div className="bg-grey-100 h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-grey-100 h-3 w-24 rounded" />
                <div className="bg-grey-100 h-4 w-full rounded" />
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
            submittingId={submittingId}
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
  submittingId: string | null;
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
  submittingId,
  replyInputRef,
}) => {
  const isOwner = currentUserId === comment.userId;
  const isReplying = replyingTo === comment.id;
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar
          src={comment.author?.profileImage}
          name={`${comment.author?.firstName || ""} ${comment.author?.lastName || ""}`}
          size="sm"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="bg-grey-100 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-content-dark text-sm font-semibold">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-grey-500 text-xs">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-content-dark-secondary mt-1 text-sm break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-1 flex items-center gap-4">
            <button
              onClick={() => onReply(comment.id)}
              className="text-grey-500 hover:text-action-600 focus-visible:text-action-600 inline-flex min-h-[44px] items-center px-1 text-xs font-medium focus-visible:outline-none"
            >
              Reply
            </button>
            {isOwner ? (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-grey-500 hover:text-danger focus-visible:text-danger inline-flex min-h-[44px] items-center px-1 text-xs font-medium focus-visible:outline-none"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => setReportingCommentId(comment.id)}
                className="text-grey-500 hover:text-danger focus-visible:text-danger inline-flex min-h-[44px] items-center px-1 text-xs font-medium focus-visible:outline-none"
              >
                Report
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
                className="border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-400 focus:border-action focus:ring-action flex-1 resize-none rounded border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
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
                disabled={submittingId === comment.id || !replyContent.trim()}
                className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[44px] rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                {submittingId === comment.id ? "Posting..." : "Reply"}
              </button>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-border-light mt-3 space-y-3 border-l-2 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar
                    src={reply.author?.profileImage}
                    name={`${reply.author?.firstName || ""} ${reply.author?.lastName || ""}`}
                    size="xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="bg-grey-100 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-content-dark text-xs font-semibold">
                          {reply.author?.firstName} {reply.author?.lastName}
                        </span>
                        <span className="text-grey-500 text-xs">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-content-dark-secondary mt-1 text-xs break-words whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      {currentUserId === reply.userId ? (
                        <button
                          onClick={() => onDelete(reply.id)}
                          className="text-grey-500 hover:text-danger focus-visible:text-danger inline-flex min-h-[44px] items-center px-1 text-xs font-medium focus-visible:outline-none"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={() => setReportingCommentId(reply.id)}
                          className="text-grey-500 hover:text-danger focus-visible:text-danger inline-flex min-h-[44px] items-center px-1 text-xs font-medium focus-visible:outline-none"
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal for comments/replies */}
      {reportingCommentId && (
        <ReportModal
          isOpen={!!reportingCommentId}
          onClose={() => setReportingCommentId(null)}
          contentType="comment"
          contentId={reportingCommentId}
          onSuccess={() => setReportingCommentId(null)}
        />
      )}
    </div>
  );
};

export default CommentSection;
