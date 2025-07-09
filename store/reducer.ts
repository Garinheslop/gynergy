import { combineReducers } from "redux";
import actionReducer from "@store/modules/action";
import bookReducer from "@store/modules/book";
import editorReducer from "@store/modules/editor";
import enrollmentReducer from "@store/modules/enrollment";
import visionReducer from "@store/modules/vision";
import globalStatesReducer from "./modules/global/globalStateReducers";
import journalReducer from "@store/modules/journal";
import historyReducer from "@store/modules/history";
import profileReducer from "@store/modules/profile";
import quoteReducer from "@store/modules/quote";
import leaderboardReducer from "@store/modules/leaderboard";
import meditationReducer from "@store/modules/meditation";
import { successReducerTypes } from "./resources/reducerActionTypes";
import { PersistConfig, persistReducer } from "redux-persist";
import { RootState } from "./configureStore";
import storage from "redux-persist/lib/storage";

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

const appReducer = combineReducers({
  actions: actionReducer,
  books: persistReducer(persistBooksConfig, bookReducer),
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
});
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
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
