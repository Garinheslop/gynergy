// Community Types

export type PostType =
  | "win"
  | "reflection"
  | "milestone"
  | "encouragement"
  | "question"
  | "celebration";

export type PostVisibility = "private" | "cohort" | "public";

export type ReactionType = "cheer" | "fire" | "heart" | "celebrate" | "inspire" | "support";

export type SocialPlatform = "twitter" | "instagram" | "linkedin" | "facebook" | "tiktok";

// Community Post
export interface CommunityPost {
  id: string;
  userId: string;
  cohortId: string | null;
  postType: PostType;
  title: string | null;
  content: string;
  mediaUrls: string[];
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  visibility: PostVisibility;
  isFeatured: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;

  // Joined data
  author?: PostAuthor;
  reactions?: PostReaction[];
  userReaction?: ReactionType | null;
  comments?: PostComment[];
  linkedBadge?: LinkedBadge | null;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  streak?: number;
  points?: number;
}

export interface PostReaction {
  id: string;
  userId: string;
  reactionType: ReactionType;
  user?: PostAuthor;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  reactionCount: number;
  createdAt: string;
  author?: PostAuthor;
  replies?: PostComment[];
}

// Comment type for Redux store (camelCase from API)
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor | null;
  replies?: Comment[];
}

export interface LinkedBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Social Connection
export interface SocialConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUsername: string;
  profileUrl: string | null;
  isVerified: boolean;
  isPublic: boolean;
}

// Referral System
export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  usesCount: number;
  totalPointsEarned: number;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: "pending" | "converted" | "expired";
  pointsAwarded: number;
  convertedAt: string | null;
  createdAt: string;
  referred?: PostAuthor;
}

export interface ReferralMilestone {
  id: string;
  name: string;
  description: string;
  referralsRequired: number;
  pointsBonus: number;
  rewardDescription: string;
  isAchieved?: boolean;
}

// Member Profile
export interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;

  // Stats
  streak: number;
  points: number;
  badgesCount: number;
  postsCount: number;
  referralsCount: number;

  // Settings
  showStreak: boolean;
  showPoints: boolean;
  showBadges: boolean;
  showSocialLinks: boolean;

  // Social
  socialConnections: SocialConnection[];

  // Cohort
  cohort?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Cohort Member
export interface CohortMember {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
  streak: number;
  points: number;
  socialConnections?: SocialConnection[];
}

// Weekly Highlights
export interface WeeklyHighlights {
  id: string;
  cohortId: string;
  weekStart: string;
  weekEnd: string;
  topPosts: CommunityPost[];
  topContributors: PostAuthor[];
  totalJournalsCompleted: number;
  totalWinsShared: number;
  communityStreak: number;
  weeklySummary: string | null;
}

// API Request/Response Types
export interface CreatePostRequest {
  postType: PostType;
  title?: string;
  content: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
  linkedJournalId?: string;
  linkedActionId?: string;
  linkedBadgeId?: string;
}

export interface AddReactionRequest {
  postId: string;
  reactionType: ReactionType;
}

export interface AddCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface ShareToSocialRequest {
  postId?: string;
  shareType: "post" | "badge" | "streak" | "referral" | "journey";
  platform: SocialPlatform;
}

// Feed Response
export interface FeedResponse {
  posts: CommunityPost[];
  hasMore: boolean;
  nextCursor: string | null;
}

// Reaction icon configuration (SVG paths + colors, no emoji)
export interface ReactionIconConfig {
  label: string;
  color: string;
  svgPath: string;
  viewBox?: string;
}

export const REACTION_ICONS: Record<ReactionType, ReactionIconConfig> = {
  cheer: {
    label: "Cheer",
    color: "#F59E0B",
    svgPath:
      "M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11",
  },
  fire: {
    label: "Fire",
    color: "#EF4444",
    svgPath:
      "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
  },
  heart: {
    label: "Love",
    color: "#EC4899",
    svgPath:
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  celebrate: {
    label: "Celebrate",
    color: "#8B5CF6",
    svgPath:
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  inspire: {
    label: "Inspire",
    color: "#06B6D4",
    svgPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  support: {
    label: "Support",
    color: "#10B981",
    svgPath:
      "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5",
  },
};

// Legacy alias for backward compatibility — maps to label text
export const REACTION_EMOJIS: Record<ReactionType, string> = Object.fromEntries(
  Object.entries(REACTION_ICONS).map(([key, config]) => [key, config.label])
) as Record<ReactionType, string>;

// Social platform icons/colors
export const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  { name: string; icon: string; color: string; urlPrefix: string }
> = {
  twitter: {
    name: "Twitter/X",
    icon: "twitter",
    color: "#1DA1F2",
    urlPrefix: "https://twitter.com/",
  },
  instagram: {
    name: "Instagram",
    icon: "instagram",
    color: "#E4405F",
    urlPrefix: "https://instagram.com/",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0A66C2",
    urlPrefix: "https://linkedin.com/in/",
  },
  facebook: {
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    urlPrefix: "https://facebook.com/",
  },
  tiktok: {
    name: "TikTok",
    icon: "tiktok",
    color: "#000000",
    urlPrefix: "https://tiktok.com/@",
  },
};

// Post type labels with color indicators (no emoji)
export const POST_TYPE_LABELS: Record<PostType, { label: string; color: string }> = {
  win: { label: "Win", color: "#F59E0B" },
  reflection: { label: "Reflection", color: "#8B5CF6" },
  milestone: { label: "Milestone", color: "#06B6D4" },
  encouragement: { label: "Encouragement", color: "#10B981" },
  question: { label: "Question", color: "#6366F1" },
  celebration: { label: "Celebration", color: "#EC4899" },
};
