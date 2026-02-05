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

// Reaction emoji mapping
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  cheer: "🙌",
  fire: "🔥",
  heart: "❤️",
  celebrate: "🎉",
  inspire: "✨",
  support: "💪",
};

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

// Post type labels
export const POST_TYPE_LABELS: Record<PostType, { label: string; emoji: string }> = {
  win: { label: "Win", emoji: "🏆" },
  reflection: { label: "Reflection", emoji: "💭" },
  milestone: { label: "Milestone", emoji: "🎯" },
  encouragement: { label: "Encouragement", emoji: "💪" },
  question: { label: "Question", emoji: "❓" },
  celebration: { label: "Celebration", emoji: "🎉" },
};
