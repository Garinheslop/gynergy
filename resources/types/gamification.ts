// Gamification Types
// Badges, achievements, multipliers, and points tracking

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type BadgeCategory =
  | "consistency"
  | "completion"
  | "speed"
  | "social"
  | "milestone"
  | "special";

export type MultiplierType = "streak" | "combo" | "time" | "special";

export type ActivityType =
  | "morning_journal"
  | "evening_journal"
  | "weekly_journal"
  | "dga"
  | "vision"
  | "badge_reward";

// Badge unlock condition types
export interface StreakCondition {
  type: "streak";
  activity: "morning" | "evening" | "gratitude" | "all" | "weekly";
  count: number;
}

export interface FirstCondition {
  type: "first";
  activity: "morning" | "evening" | "dga";
}

export interface ComboCondition {
  type: "combo";
  activities: string[];
  count?: number;
}

export interface TimeCondition {
  type: "time";
  activity: string;
  activities?: string[];
  before?: string;
  after?: string;
  count?: number;
}

export interface ShareCondition {
  type: "share";
  count: number;
}

export interface EncourageCondition {
  type: "encourage";
  count: number;
}

export interface MilestoneCondition {
  type: "milestone";
  number: number;
}

export interface ComebackCondition {
  type: "comeback";
  days_away: number;
}

export interface WeekendCondition {
  type: "weekend";
  complete: boolean;
}

export interface MoodCondition {
  type: "mood";
  improvement: boolean;
  count: number;
}

export interface CompleteCondition {
  type: "complete" | "graduate";
  activity?: string;
}

export type UnlockCondition =
  | StreakCondition
  | FirstCondition
  | ComboCondition
  | TimeCondition
  | ShareCondition
  | EncourageCondition
  | MilestoneCondition
  | ComebackCondition
  | WeekendCondition
  | MoodCondition
  | CompleteCondition;

// Badge definition from database
export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  unlockCondition: UnlockCondition;
  animationType: string;
  pointsReward: number;
  isHidden: boolean;
  sortOrder: number;
  createdAt: string;
}

// User badge (earned badge)
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  sessionId: string | null;
  unlockedAt: string;
  isShowcased: boolean;
  isNew: boolean;
  // Joined from badges table
  badge?: Badge;
}

// Multiplier configuration
export interface MultiplierConfig {
  id: string;
  name: string;
  multiplierType: MultiplierType;
  condition: {
    min_streak?: number;
    max_streak?: number | null;
    activities?: string[];
    type?: string;
    activity?: string;
    before?: string;
  };
  multiplierValue: number;
  bonusPoints: number;
  isActive: boolean;
  createdAt: string;
}

// Points transaction record
export interface PointsTransaction {
  id: string;
  userId: string;
  sessionId: string | null;
  activityType: ActivityType;
  basePoints: number;
  multiplier: number;
  bonusPoints: number;
  finalPoints: number;
  sourceId: string | null;
  sourceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// API Request Types
export const gamificationRequestTypes = {
  getAllBadges: "all-badges",
  getUserBadges: "user-badges",
  getNewBadges: "new-badges",
  markBadgeSeen: "mark-seen",
  getMultipliers: "multipliers",
  getActiveMultiplier: "active-multiplier",
  getPointsHistory: "points-history",
  getTotalPoints: "total-points",
  checkBadges: "check-badges",
  toggleShowcase: "toggle-showcase",
} as const;

// Celebration event for popup queue
export interface CelebrationEvent {
  id: string;
  type: "badge" | "milestone" | "streak" | "points" | "level_up";
  priority: number;
  data: {
    badge?: Badge;
    userBadge?: UserBadge;
    streak?: number;
    points?: number;
    milestone?: number;
    message?: string;
  };
  createdAt: string;
}

// User gamification stats
export interface UserGamificationStats {
  totalPoints: number;
  totalBadges: number;
  currentStreak: {
    morning: number;
    evening: number;
    gratitude: number;
    combined: number;
  };
  activeMultiplier: {
    value: number;
    name: string;
  } | null;
  recentBadges: UserBadge[];
  showcasedBadges: UserBadge[];
}

// Points calculation input
export interface PointsCalculationInput {
  activityType: ActivityType;
  basePoints: number;
  streak: number;
  hasCombo: boolean;
  isEarlyBird: boolean;
  timestamp?: Date;
}

// Points calculation result
export interface PointsCalculationResult {
  basePoints: number;
  multiplier: number;
  bonusPoints: number;
  finalPoints: number;
  appliedMultipliers: string[];
}

// Badge check context
export interface BadgeCheckContext {
  userId: string;
  sessionId: string;
  activityType: ActivityType;
  timestamp: Date;
  userTimezone: string;
  streaks: {
    morning: number;
    evening: number;
    gratitude: number;
    combined: number;
    weekly: number;
  };
  completedToday: {
    morning: boolean;
    evening: boolean;
    dga: boolean;
  };
  totalCounts: {
    morningJournals: number;
    eveningJournals: number;
    dgas: number;
    shares: number;
    encouragements: number;
  };
  moodHistory: {
    date: string;
    score: number;
  }[];
  milestone?: number;
  dayInJourney: number;
  lastJournalDate?: string;
}

// Badge check result
export interface BadgeCheckResult {
  newBadges: Badge[];
  pointsAwarded: number;
  celebrationEvents: CelebrationEvent[];
}

// Base points configuration
export const BASE_POINTS = {
  morning_journal: 10,
  evening_journal: 10,
  weekly_journal: 25,
  dga: 15,
  vision: 20,
  badge_reward: 0, // Variable based on badge
} as const;
