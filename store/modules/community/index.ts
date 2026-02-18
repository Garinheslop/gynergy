// Community Redux Module
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  CommunityPost,
  CohortMember,
  ReferralCode,
  Referral,
  ReferralMilestone,
  ReactionType,
  Comment,
} from "@resources/types/community";
import { CommunityEvent, EventAttendee } from "@resources/types/communityEvent";
import { AppThunk } from "@store/configureStore";

interface CommunityState {
  // Feed
  posts: CommunityPost[];
  feedLoading: boolean;
  feedError: string | null;
  hasMore: boolean;
  nextCursor: string | null;

  // Comments
  comments: Record<string, Comment[]>; // postId -> comments
  commentsLoading: Record<string, boolean>;
  expandedComments: string[]; // postIds with expanded comments

  // Members
  members: CohortMember[];
  membersLoading: boolean;
  membersError: string | null;
  cohort: { id: string; name: string; slug: string } | null;

  // Referrals
  referralCode: ReferralCode | null;
  referrals: Referral[];
  milestones: ReferralMilestone[];
  referralsLoading: boolean;
  referralsError: string | null;
  referralStats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalPointsEarned: number;
  };

  // Events
  events: {
    upcoming: CommunityEvent[];
    past: CommunityEvent[];
    attendees: Record<string, EventAttendee[]>;
  };
  eventsLoading: boolean;
  eventsError: string | null;

  // UI State
  createPostOpen: boolean;
  selectedPostId: string | null;
}

const initialState: CommunityState = {
  posts: [],
  feedLoading: false,
  feedError: null,
  hasMore: true,
  nextCursor: null,

  comments: {},
  commentsLoading: {},
  expandedComments: [],

  members: [],
  membersLoading: false,
  membersError: null,
  cohort: null,

  referralCode: null,
  referrals: [],
  milestones: [],
  referralsLoading: false,
  referralsError: null,
  referralStats: {
    totalReferrals: 0,
    convertedReferrals: 0,
    totalPointsEarned: 0,
  },

  events: {
    upcoming: [],
    past: [],
    attendees: {},
  },
  eventsLoading: false,
  eventsError: null,

  createPostOpen: false,
  selectedPostId: null,
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    // Feed actions
    setFeedLoading: (state, action: PayloadAction<boolean>) => {
      state.feedLoading = action.payload;
    },
    setFeedError: (state, action: PayloadAction<string | null>) => {
      state.feedError = action.payload;
    },
    setPosts: (
      state,
      action: PayloadAction<{
        posts: CommunityPost[];
        hasMore: boolean;
        nextCursor: string | null;
        append?: boolean;
      }>
    ) => {
      if (action.payload.append) {
        state.posts = [...state.posts, ...action.payload.posts];
      } else {
        state.posts = action.payload.posts;
      }
      state.hasMore = action.payload.hasMore;
      state.nextCursor = action.payload.nextCursor;
    },
    addPost: (state, action: PayloadAction<CommunityPost>) => {
      // Deduplicate: Realtime INSERT may arrive after a fetch that already includes the post
      if (state.posts.some((p) => p.id === action.payload.id)) return;
      state.posts = [action.payload, ...state.posts];
    },
    updatePost: (
      state,
      action: PayloadAction<{ postId: string; title: string | null; content: string }>
    ) => {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) {
        post.title = action.payload.title;
        post.content = action.payload.content;
        post.updatedAt = new Date().toISOString();
      }
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
    },
    updatePostReaction: (
      state,
      action: PayloadAction<{ postId: string; reaction: ReactionType | null; delta: number }>
    ) => {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) {
        post.userReaction = action.payload.reaction;
        post.reactionCount = Math.max(0, post.reactionCount + action.payload.delta);
      }
    },
    updatePostCommentCount: (state, action: PayloadAction<{ postId: string; delta: number }>) => {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) {
        post.commentCount = Math.max(0, post.commentCount + action.payload.delta);
      }
    },

    // Comments actions
    setCommentsLoading: (state, action: PayloadAction<{ postId: string; loading: boolean }>) => {
      state.commentsLoading[action.payload.postId] = action.payload.loading;
    },
    setComments: (state, action: PayloadAction<{ postId: string; comments: Comment[] }>) => {
      state.comments[action.payload.postId] = action.payload.comments;
    },
    addComment: (state, action: PayloadAction<{ postId: string; comment: Comment }>) => {
      const postComments = state.comments[action.payload.postId] || [];
      if (action.payload.comment.parentId) {
        // Add reply to parent comment
        const parentComment = postComments.find((c) => c.id === action.payload.comment.parentId);
        if (parentComment) {
          parentComment.replies = [...(parentComment.replies || []), action.payload.comment];
        }
      } else {
        // Add top-level comment
        state.comments[action.payload.postId] = [action.payload.comment, ...postComments];
      }
    },
    removeComment: (state, action: PayloadAction<{ postId: string; commentId: string }>) => {
      const postComments = state.comments[action.payload.postId] || [];
      // Check if it's a top-level comment
      const topLevelIndex = postComments.findIndex((c) => c.id === action.payload.commentId);
      if (topLevelIndex !== -1) {
        state.comments[action.payload.postId] = postComments.filter(
          (c) => c.id !== action.payload.commentId
        );
      } else {
        // Remove from replies
        postComments.forEach((comment) => {
          if (comment.replies) {
            comment.replies = comment.replies.filter((r) => r.id !== action.payload.commentId);
          }
        });
      }
    },
    toggleExpandComments: (state, action: PayloadAction<string>) => {
      const postId = action.payload;
      if (state.expandedComments.includes(postId)) {
        state.expandedComments = state.expandedComments.filter((id) => id !== postId);
      } else {
        state.expandedComments.push(postId);
      }
    },

    // Members actions
    setMembersLoading: (state, action: PayloadAction<boolean>) => {
      state.membersLoading = action.payload;
    },
    setMembersError: (state, action: PayloadAction<string | null>) => {
      state.membersError = action.payload;
    },
    setMembers: (
      state,
      action: PayloadAction<{
        members: CohortMember[];
        cohort: { id: string; name: string; slug: string } | null;
      }>
    ) => {
      state.members = action.payload.members;
      state.cohort = action.payload.cohort;
    },

    // Referrals actions
    setReferralsLoading: (state, action: PayloadAction<boolean>) => {
      state.referralsLoading = action.payload;
    },
    setReferralsError: (state, action: PayloadAction<string | null>) => {
      state.referralsError = action.payload;
    },
    setReferralData: (
      state,
      action: PayloadAction<{
        referralCode: ReferralCode | null;
        referrals: Referral[];
        milestones: ReferralMilestone[];
        stats: {
          totalReferrals: number;
          convertedReferrals: number;
          totalPointsEarned: number;
        };
      }>
    ) => {
      state.referralCode = action.payload.referralCode;
      state.referrals = action.payload.referrals;
      state.milestones = action.payload.milestones;
      state.referralStats = action.payload.stats;
    },

    // Events actions
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.eventsLoading = action.payload;
    },
    setEventsError: (state, action: PayloadAction<string | null>) => {
      state.eventsError = action.payload;
    },
    setEvents: (
      state,
      action: PayloadAction<{
        upcoming: CommunityEvent[];
        past: CommunityEvent[];
        attendees: Record<string, EventAttendee[]>;
      }>
    ) => {
      state.events = action.payload;
    },

    // UI actions
    setCreatePostOpen: (state, action: PayloadAction<boolean>) => {
      state.createPostOpen = action.payload;
    },
    setSelectedPostId: (state, action: PayloadAction<string | null>) => {
      state.selectedPostId = action.payload;
    },

    // Reset
    resetCommunity: () => initialState,
  },
});

export const {
  setFeedLoading,
  setFeedError,
  setPosts,
  addPost,
  updatePost,
  removePost,
  updatePostReaction,
  updatePostCommentCount,
  setCommentsLoading,
  setComments,
  addComment,
  removeComment,
  toggleExpandComments,
  setMembersLoading,
  setMembersError,
  setMembers,
  setReferralsLoading,
  setReferralsError,
  setReferralData,
  setEventsLoading,
  setEventsError,
  setEvents,
  setCreatePostOpen,
  setSelectedPostId,
  resetCommunity,
} = communitySlice.actions;

export default communitySlice.reducer;

// Thunk actions
export const fetchFeed =
  (options?: { append?: boolean; postType?: string }): AppThunk =>
  async (dispatch, getState) => {
    const state = getState().community;

    if (state.feedLoading) return;

    dispatch(setFeedLoading(true));
    dispatch(setFeedError(null));

    try {
      const params = new URLSearchParams();
      if (options?.append && state.nextCursor) {
        params.set("cursor", state.nextCursor);
      }
      if (options?.postType) {
        params.set("type", options.postType);
      }

      const response = await fetch(`/api/community/feed?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch feed");
      }

      dispatch(
        setPosts({
          posts: data.posts,
          hasMore: data.hasMore,
          nextCursor: data.nextCursor,
          append: options?.append,
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch feed";
      dispatch(setFeedError(message));
    } finally {
      dispatch(setFeedLoading(false));
    }
  };

export const createPost =
  (postData: {
    postType: string;
    title?: string;
    content: string;
    mediaUrls?: string[];
    visibility?: string;
  }): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    try {
      const response = await fetch("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      dispatch(addPost(data.post));
      dispatch(setCreatePostOpen(false));

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create post";
      return { success: false, error: message };
    }
  };

export const toggleReaction =
  (postId: string, reactionType: ReactionType): AppThunk =>
  async (dispatch, getState) => {
    const state = getState().community;
    const post = state.posts.find((p: CommunityPost) => p.id === postId);

    if (!post) return;

    const hadReaction = !!post.userReaction;
    const sameReaction = post.userReaction === reactionType;

    // Optimistic update
    if (sameReaction) {
      // Remove reaction
      dispatch(updatePostReaction({ postId, reaction: null, delta: -1 }));
    } else if (hadReaction) {
      // Change reaction (no count change)
      dispatch(updatePostReaction({ postId, reaction: reactionType, delta: 0 }));
    } else {
      // Add reaction
      dispatch(updatePostReaction({ postId, reaction: reactionType, delta: 1 }));
    }

    try {
      if (sameReaction) {
        // Remove reaction
        await fetch("/api/community/reactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
      } else {
        // Add/update reaction
        await fetch("/api/community/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, reactionType }),
        });
      }
    } catch {
      // Revert on error
      dispatch(
        updatePostReaction({
          postId,
          reaction: post.userReaction ?? null,
          delta: sameReaction ? 1 : hadReaction ? 0 : -1,
        })
      );
    }
  };

export const fetchMembers = (): AppThunk => async (dispatch) => {
  dispatch(setMembersLoading(true));
  dispatch(setMembersError(null));

  try {
    const response = await fetch("/api/community/members");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch members");
    }

    dispatch(
      setMembers({
        members: data.members,
        cohort: data.cohort,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load members";
    dispatch(setMembersError(message));
  } finally {
    dispatch(setMembersLoading(false));
  }
};

export const fetchReferrals = (): AppThunk => async (dispatch) => {
  dispatch(setReferralsLoading(true));
  dispatch(setReferralsError(null));

  try {
    const response = await fetch("/api/community/referrals");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch referrals");
    }

    dispatch(
      setReferralData({
        referralCode: data.referralCode,
        referrals: data.referrals,
        milestones: data.milestones,
        stats: data.stats,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load referrals";
    dispatch(setReferralsError(message));
  } finally {
    dispatch(setReferralsLoading(false));
  }
};

// Comment thunks
export const fetchComments =
  (postId: string): AppThunk =>
  async (dispatch, getState) => {
    const state = getState().community;
    if (state.commentsLoading[postId]) return;

    dispatch(setCommentsLoading({ postId, loading: true }));

    try {
      const response = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch comments");
      }

      dispatch(setComments({ postId, comments: data.comments }));
    } catch {
      // Error is logged server-side
    } finally {
      dispatch(setCommentsLoading({ postId, loading: false }));
    }
  };

export const createComment =
  (
    postId: string,
    content: string,
    parentId?: string
  ): AppThunk<Promise<{ success: boolean; comment?: Comment; error?: string }>> =>
  async (dispatch) => {
    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create comment");
      }

      dispatch(addComment({ postId, comment: data.comment }));
      dispatch(updatePostCommentCount({ postId, delta: 1 }));

      return { success: true, comment: data.comment };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create comment";
      return { success: false, error: message };
    }
  };

export const deleteComment =
  (postId: string, commentId: string): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    try {
      const response = await fetch(`/api/community/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      dispatch(removeComment({ postId, commentId }));
      dispatch(updatePostCommentCount({ postId, delta: -1 }));

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete comment";
      return { success: false, error: message };
    }
  };

export const incrementShareCount =
  (postId: string): AppThunk =>
  async () => {
    try {
      await fetch("/api/community/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
    } catch {
      // Silent fail for share count
    }
  };

export const editPost =
  (
    postId: string,
    data: { title?: string; content: string }
  ): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    try {
      const response = await fetch("/api/community/feed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, ...data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update post");
      }

      dispatch(
        updatePost({
          postId,
          title: data.title?.trim() || null,
          content: data.content.trim(),
        })
      );

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update post";
      return { success: false, error: message };
    }
  };

export const deletePost =
  (postId: string): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    try {
      const response = await fetch(`/api/community/feed?postId=${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }

      dispatch(removePost(postId));
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      return { success: false, error: message };
    }
  };

export const sendEncouragement =
  (memberId: string): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async () => {
    try {
      const response = await fetch("/api/community/encourage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send encouragement");
      }

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send encouragement";
      return { success: false, error: message };
    }
  };
