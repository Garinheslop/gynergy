import * as urls from "../../configs/urls";
import gamification from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { gamificationRequestTypes } from "@resources/types/gamification";

const {
  badgesRequested,
  badgesFetched,
  badgesFailed,
  userBadgesRequested,
  userBadgesFetched,
  userBadgesFailed,
  multipliersRequested,
  multipliersFetched,
  activeMultiplierFetched,
  multipliersFailed,
  pointsRequested,
  totalPointsFetched,
  pointsHistoryFetched,
  pointsFailed,
} = gamification.actions;

// Export individual actions for use in components
export const {
  badgeAdded,
  badgeMarkedSeen,
  badgeShowcaseToggled,
  pointsAdded,
  celebrationQueued,
  celebrationsQueued,
  celebrationDismissed,
  celebrationsClear,
  markingSeenStarted,
  markingSeenFinished,
  togglingShowcaseStarted,
  togglingShowcaseFinished,
  checkingBadgesStarted,
  checkingBadgesFinished,
  gamificationReset,
} = gamification.actions;

export default gamification.reducer;

// Thunk actions

/**
 * Fetch all badge definitions
 */
export const fetchAllBadges = () =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getAllBadges}`,
    onStart: badgesRequested.type,
    onSuccess: badgesFetched.type,
    onError: badgesFailed.type,
  });

/**
 * Fetch user's earned badges for a session
 */
export const fetchUserBadges = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getUserBadges}?sessionId=${sessionId}`,
    onStart: userBadgesRequested.type,
    onSuccess: userBadgesFetched.type,
    onError: userBadgesFailed.type,
  });

/**
 * Fetch new (unseen) badges
 */
export const fetchNewBadges = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getNewBadges}?sessionId=${sessionId}`,
    onStart: userBadgesRequested.type,
    onSuccess: userBadgesFetched.type,
    onError: userBadgesFailed.type,
  });

/**
 * Fetch multiplier configurations
 */
export const fetchMultipliers = () =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getMultipliers}`,
    onStart: multipliersRequested.type,
    onSuccess: multipliersFetched.type,
    onError: multipliersFailed.type,
  });

/**
 * Fetch active multiplier for user in session
 */
export const fetchActiveMultiplier = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getActiveMultiplier}?sessionId=${sessionId}`,
    onStart: multipliersRequested.type,
    onSuccess: activeMultiplierFetched.type,
    onError: multipliersFailed.type,
  });

/**
 * Fetch points history for user in session
 */
export const fetchPointsHistory = (sessionId: string, limit: number = 50) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getPointsHistory}?sessionId=${sessionId}&limit=${limit}`,
    onStart: pointsRequested.type,
    onSuccess: pointsHistoryFetched.type,
    onError: pointsFailed.type,
  });

/**
 * Fetch total points for user in session
 */
export const fetchTotalPoints = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.getTotalPoints}?sessionId=${sessionId}`,
    onStart: pointsRequested.type,
    onSuccess: totalPointsFetched.type,
    onError: pointsFailed.type,
  });

/**
 * Mark a badge as seen
 */
export const markBadgeSeen = (badgeId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.markBadgeSeen}`,
    method: "POST",
    data: { badgeId },
    onStart: markingSeenStarted.type,
    onSuccess: markingSeenFinished.type,
    onError: markingSeenFinished.type,
  });

/**
 * Toggle badge showcase status
 */
export const toggleBadgeShowcase = (badgeId: string, sessionId: string) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.toggleShowcase}`,
    method: "POST",
    data: { badgeId, sessionId },
    onStart: togglingShowcaseStarted.type,
    onSuccess: togglingShowcaseFinished.type,
    onError: togglingShowcaseFinished.type,
  });

/**
 * Check and award badges after completing an activity
 */
export const checkBadges = (sessionId: string, context: any) =>
  apiCallBegan({
    url: `${urls.gamification}/${gamificationRequestTypes.checkBadges}`,
    method: "POST",
    data: { sessionId, context },
    onStart: checkingBadgesStarted.type,
    onSuccess: checkingBadgesFinished.type,
    onError: checkingBadgesFinished.type,
  });
