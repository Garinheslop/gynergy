import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Badge,
  UserBadge,
  MultiplierConfig,
  PointsTransaction,
  CelebrationEvent,
} from "@resources/types/gamification";

interface GamificationState {
  // All badge definitions
  badges: {
    all: Badge[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  // User's earned badges
  userBadges: {
    data: UserBadge[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  // Multiplier configurations
  multipliers: {
    all: MultiplierConfig[];
    active: { value: number; name: string } | null;
    currentStreak: number;
    loading: boolean;
    error: string;
  };
  // Points tracking
  points: {
    total: number;
    history: PointsTransaction[];
    loading: boolean;
    error: string;
  };
  // Celebration queue for popups
  celebrations: {
    queue: CelebrationEvent[];
    current: CelebrationEvent | null;
  };
  // Operation states
  operations: {
    markingSeen: boolean;
    togglingShowcase: boolean;
    checkingBadges: boolean;
  };
}

const initialState: GamificationState = {
  badges: {
    all: [],
    loading: false,
    fetched: false,
    error: "",
  },
  userBadges: {
    data: [],
    loading: false,
    fetched: false,
    error: "",
  },
  multipliers: {
    all: [],
    active: null,
    currentStreak: 0,
    loading: false,
    error: "",
  },
  points: {
    total: 0,
    history: [],
    loading: false,
    error: "",
  },
  celebrations: {
    queue: [],
    current: null,
  },
  operations: {
    markingSeen: false,
    togglingShowcase: false,
    checkingBadges: false,
  },
};

const slice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    // Badge actions
    badgesRequested: (state) => {
      state.badges.loading = true;
      state.badges.error = "";
    },
    badgesFetched: (state, action: PayloadAction<{ badges: Badge[] }>) => {
      state.badges.all = action.payload.badges;
      state.badges.loading = false;
      state.badges.fetched = true;
    },
    badgesFailed: (state, action: PayloadAction<string>) => {
      state.badges.error = action.payload;
      state.badges.loading = false;
    },

    // User badges actions
    userBadgesRequested: (state) => {
      state.userBadges.loading = true;
      state.userBadges.error = "";
    },
    userBadgesFetched: (state, action: PayloadAction<{ badges: UserBadge[] }>) => {
      state.userBadges.data = action.payload.badges;
      state.userBadges.loading = false;
      state.userBadges.fetched = true;
    },
    userBadgesFailed: (state, action: PayloadAction<string>) => {
      state.userBadges.error = action.payload;
      state.userBadges.loading = false;
    },
    badgeAdded: (state, action: PayloadAction<UserBadge>) => {
      // Add new badge to the list (from real-time subscription)
      const exists = state.userBadges.data.some((b) => b.id === action.payload.id);
      if (!exists) {
        state.userBadges.data.unshift(action.payload);
      }
    },
    badgeMarkedSeen: (state, action: PayloadAction<string>) => {
      const badge = state.userBadges.data.find((b) => b.badgeId === action.payload);
      if (badge) {
        badge.isNew = false;
      }
    },
    badgeShowcaseToggled: (
      state,
      action: PayloadAction<{ badgeId: string; isShowcased: boolean }>
    ) => {
      const badge = state.userBadges.data.find((b) => b.badgeId === action.payload.badgeId);
      if (badge) {
        badge.isShowcased = action.payload.isShowcased;
      }
    },

    // Multiplier actions
    multipliersRequested: (state) => {
      state.multipliers.loading = true;
      state.multipliers.error = "";
    },
    multipliersFetched: (state, action: PayloadAction<{ multipliers: MultiplierConfig[] }>) => {
      state.multipliers.all = action.payload.multipliers;
      state.multipliers.loading = false;
    },
    activeMultiplierFetched: (
      state,
      action: PayloadAction<{
        multiplier: { value: number; name: string } | null;
        streak: number;
      }>
    ) => {
      state.multipliers.active = action.payload.multiplier;
      state.multipliers.currentStreak = action.payload.streak;
      state.multipliers.loading = false;
    },
    multipliersFailed: (state, action: PayloadAction<string>) => {
      state.multipliers.error = action.payload;
      state.multipliers.loading = false;
    },

    // Points actions
    pointsRequested: (state) => {
      state.points.loading = true;
      state.points.error = "";
    },
    totalPointsFetched: (state, action: PayloadAction<{ totalPoints: number }>) => {
      state.points.total = action.payload.totalPoints;
      state.points.loading = false;
    },
    pointsHistoryFetched: (state, action: PayloadAction<{ transactions: PointsTransaction[] }>) => {
      state.points.history = action.payload.transactions;
      state.points.loading = false;
    },
    pointsAdded: (state, action: PayloadAction<number>) => {
      state.points.total += action.payload;
    },
    pointsFailed: (state, action: PayloadAction<string>) => {
      state.points.error = action.payload;
      state.points.loading = false;
    },

    // Celebration queue actions
    celebrationQueued: (state, action: PayloadAction<CelebrationEvent>) => {
      // Insert based on priority (higher priority first)
      const event = action.payload;
      const index = state.celebrations.queue.findIndex((e) => e.priority < event.priority);
      if (index === -1) {
        state.celebrations.queue.push(event);
      } else {
        state.celebrations.queue.splice(index, 0, event);
      }
      // If no current celebration, set this as current
      if (!state.celebrations.current && state.celebrations.queue.length > 0) {
        state.celebrations.current = state.celebrations.queue[0];
      }
    },
    celebrationsQueued: (state, action: PayloadAction<CelebrationEvent[]>) => {
      // Add multiple celebrations (already sorted by priority)
      action.payload.forEach((event) => {
        const index = state.celebrations.queue.findIndex((e) => e.priority < event.priority);
        if (index === -1) {
          state.celebrations.queue.push(event);
        } else {
          state.celebrations.queue.splice(index, 0, event);
        }
      });
      // If no current celebration, set first in queue
      if (!state.celebrations.current && state.celebrations.queue.length > 0) {
        state.celebrations.current = state.celebrations.queue[0];
      }
    },
    celebrationDismissed: (state) => {
      // Remove current celebration and move to next
      if (state.celebrations.queue.length > 0) {
        state.celebrations.queue.shift();
      }
      state.celebrations.current =
        state.celebrations.queue.length > 0 ? state.celebrations.queue[0] : null;
    },
    celebrationsClear: (state) => {
      state.celebrations.queue = [];
      state.celebrations.current = null;
    },

    // Operation states
    markingSeenStarted: (state) => {
      state.operations.markingSeen = true;
    },
    markingSeenFinished: (state) => {
      state.operations.markingSeen = false;
    },
    togglingShowcaseStarted: (state) => {
      state.operations.togglingShowcase = true;
    },
    togglingShowcaseFinished: (state) => {
      state.operations.togglingShowcase = false;
    },
    checkingBadgesStarted: (state) => {
      state.operations.checkingBadges = true;
    },
    checkingBadgesFinished: (state) => {
      state.operations.checkingBadges = false;
    },

    // Reset state
    gamificationReset: () => initialState,
  },
});

export default slice;
