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
  cohort: { id: string; name: string; slug: string } | null;

  // Referrals
  referralCode: ReferralCode | null;
  referrals: Referral[];
  milestones: ReferralMilestone[];
  referralsLoading: boolean;
  referralStats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalPointsEarned: number;
  };

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
  cohort: null,

  referralCode: null,
  referrals: [],
  milestones: [],
  referralsLoading: false,
  referralStats: {
    totalReferrals: 0,
    convertedReferrals: 0,
    totalPointsEarned: 0,
  },

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
      state.posts = [action.payload, ...state.posts];
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
  updatePostReaction,
  updatePostCommentCount,
  setCommentsLoading,
  setComments,
  addComment,
  removeComment,
  toggleExpandComments,
  setMembersLoading,
  setMembers,
  setReferralsLoading,
  setReferralData,
  setCreatePostOpen,
  setSelectedPostId,
  resetCommunity,
} = communitySlice.actions;

export default communitySlice.reducer;

// Thunk actions
export const fetchFeed =
  (options?: { append?: boolean; postType?: string }) =>
  async (dispatch: any, getState: () => any) => {
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
    } catch (error: any) {
      dispatch(setFeedError(error.message));
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
  }) =>
  async (dispatch: any) => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

export const toggleReaction =
  (postId: string, reactionType: ReactionType) => async (dispatch: any, getState: () => any) => {
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
    } catch (error) {
      // Revert on error
      dispatch(
        updatePostReaction({
          postId,
          reaction: post.userReaction,
          delta: sameReaction ? 1 : hadReaction ? 0 : -1,
        })
      );
    }
  };

export const fetchMembers = () => async (dispatch: any) => {
  dispatch(setMembersLoading(true));

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
  } catch (error) {
    console.error("Fetch members error:", error);
  } finally {
    dispatch(setMembersLoading(false));
  }
};

export const fetchReferrals = () => async (dispatch: any) => {
  dispatch(setReferralsLoading(true));

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
  } catch (error) {
    console.error("Fetch referrals error:", error);
  } finally {
    dispatch(setReferralsLoading(false));
  }
};

// Comment thunks
export const fetchComments = (postId: string) => async (dispatch: any, getState: () => any) => {
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
  } catch (error) {
    console.error("Fetch comments error:", error);
  } finally {
    dispatch(setCommentsLoading({ postId, loading: false }));
  }
};

export const createComment =
  (postId: string, content: string, parentId?: string) => async (dispatch: any) => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

export const deleteComment =
  (postId: string, commentId: string) => async (dispatch: any) => {
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

export const incrementShareCount = (postId: string) => async () => {
  try {
    await fetch("/api/community/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
  } catch (error) {
    console.error("Share count error:", error);
  }
};

export const sendEncouragement = (memberId: string) => async () => {
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
