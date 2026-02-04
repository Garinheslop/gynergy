/**
 * MSW Handlers - Main Export
 * Combines all API handlers for use with MSW
 */
import { authHandlers } from "./auth";
import { bookHandlers, resetBooksStore, setBooksStore } from "./books";
import { enrollmentHandlers, resetEnrollmentsStore, setEnrollmentsStore } from "./enrollments";
import {
  gamificationHandlers,
  resetGamificationStore,
  setBadgesStore,
  setUserBadgesStore,
  setPointsStore,
} from "./gamification";
import { journalHandlers, resetJournalsStore, setJournalsStore } from "./journals";
import {
  paymentHandlers,
  resetPaymentsStore,
  setEntitlementsStore,
  setFriendCodesStore,
} from "./payments";
import { userHandlers, resetUserStore, setUserStore } from "./user";

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...journalHandlers,
  ...gamificationHandlers,
  ...userHandlers,
  ...bookHandlers,
  ...enrollmentHandlers,
  ...paymentHandlers,
];

// Export individual handler groups for selective use
export {
  authHandlers,
  journalHandlers,
  gamificationHandlers,
  userHandlers,
  bookHandlers,
  enrollmentHandlers,
  paymentHandlers,
};

// Export store manipulation functions
export const stores = {
  // Reset all stores
  resetAll: () => {
    resetJournalsStore();
    resetGamificationStore();
    resetUserStore();
    resetBooksStore();
    resetEnrollmentsStore();
    resetPaymentsStore();
  },

  // Journals
  journals: {
    reset: resetJournalsStore,
    set: setJournalsStore,
  },

  // Gamification
  gamification: {
    reset: resetGamificationStore,
    setBadges: setBadgesStore,
    setUserBadges: setUserBadgesStore,
    setPoints: setPointsStore,
  },

  // User
  user: {
    reset: resetUserStore,
    set: setUserStore,
  },

  // Books
  books: {
    reset: resetBooksStore,
    set: setBooksStore,
  },

  // Enrollments
  enrollments: {
    reset: resetEnrollmentsStore,
    set: setEnrollmentsStore,
  },

  // Payments
  payments: {
    reset: resetPaymentsStore,
    setEntitlements: setEntitlementsStore,
    setFriendCodes: setFriendCodesStore,
  },
};

export default handlers;
