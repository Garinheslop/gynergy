import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";

import storage from "./storage";

import actionReducer from "@store/modules/action";
import aiReducer from "@store/modules/ai/reducers";
import bookReducer from "@store/modules/book";
import communityReducer from "@store/modules/community";
import editorReducer from "@store/modules/editor";
import enrollmentReducer from "@store/modules/enrollment";
import gamificationReducer from "@store/modules/gamification";
import historyReducer from "@store/modules/history";
import journalReducer from "@store/modules/journal";
import leaderboardReducer from "@store/modules/leaderboard";
import meditationReducer from "@store/modules/meditation";
import { paymentReducer } from "@store/modules/payment";
import profileReducer from "@store/modules/profile";
import quoteReducer from "@store/modules/quote";
import videoReducer from "@store/modules/video/reducers";
import visionReducer from "@store/modules/vision";

import globalStatesReducer from "./modules/global/globalStateReducers";
import { successReducerTypes } from "./resources/reducerActionTypes";

const persistBooksConfig = {
  key: "books",
  storage,
  blacklist: ["loading", "lastFetched"],
};
const persistEnrollmentsConfig = {
  key: "enrollments",
  storage,
  blacklist: ["current", "loading", "lastFetched"],
};

const persistJournalsConfig = {
  key: "journals",
  storage,
  blacklist: ["current", "loading", "lastFetched"],
};

const persistLeaderboardConfig = {
  key: "leaderboard",
  storage,
  blacklist: ["current", "loading", "lastFetched"],
};

const persistVisionsConfig = {
  key: "visions",
  storage,
  blacklist: ["fetched", "loading"],
};

const persistHistoriesConfig = {
  key: "histories",
  storage,
  blacklist: ["lastFetched", "current", "fetched", "loading"],
};

const persistGamificationConfig = {
  key: "gamification",
  storage,
  blacklist: [
    "badges.loading",
    "userBadges.loading",
    "multipliers.loading",
    "points.loading",
    "operations",
    "celebrations",
  ],
};

const persistAIConfig = {
  key: "ai",
  storage,
  blacklist: [
    "characters.loading",
    "chat.loading",
    "chat.isStreaming",
    "chat.streamingContent",
    "chat.error",
  ],
};

const persistVideoConfig = {
  key: "video",
  storage,
  blacklist: [
    "rooms.loading",
    "currentRoom.loading",
    "upcoming.loading",
    "invitations.loading",
    "templates.loading",
    "connection",
  ],
};

const persistPaymentConfig = {
  key: "payment",
  storage,
  blacklist: ["loading", "redeemingCode", "redeemError", "redeemSuccess"],
};

const persistCommunityConfig = {
  key: "community",
  storage,
  blacklist: ["feedLoading", "feedError", "membersLoading", "referralsLoading", "createPostOpen"],
};

const appReducer = combineReducers({
  actions: actionReducer,
  books: persistReducer(persistBooksConfig, bookReducer),
  community: persistReducer(persistCommunityConfig, communityReducer),
  enrollments: persistReducer(persistEnrollmentsConfig, enrollmentReducer),
  editor: editorReducer,
  visions: persistReducer(persistVisionsConfig, visionReducer),
  global: globalStatesReducer,
  journals: persistReducer(persistJournalsConfig, journalReducer),
  histories: persistReducer(persistHistoriesConfig, historyReducer),
  profile: profileReducer,
  quotes: quoteReducer,
  leaderboard: persistReducer(persistLeaderboardConfig, leaderboardReducer),
  meditations: meditationReducer,
  gamification: persistReducer(persistGamificationConfig, gamificationReducer),
  ai: persistReducer(persistAIConfig, aiReducer),
  video: persistReducer(persistVideoConfig, videoReducer.reducer),
  payment: persistReducer(persistPaymentConfig, paymentReducer),
});
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: { type: string }
) => {
  if (
    action.type === successReducerTypes.signOutUser ||
    action.type === successReducerTypes.resetEnrollment
  ) {
    const initialState = appReducer(undefined, { type: "@@INIT" });
    const currentGlobal = state?.global || initialState.global;
    state = { ...initialState, global: currentGlobal };
  }
  return appReducer(state, action);
};

export default rootReducer;
