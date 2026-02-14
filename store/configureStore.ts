import {
  Action,
  configureStore,
  EnhancedStore,
  ThunkAction,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  PersistConfig,
  createMigrate,
  PersistedState,
} from "redux-persist";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";

import reducer from "@store/reducer";

import api from "./middleware/api";
import resetDataMiddleware from "./middleware/reset";
import { streakDefaultStates } from "./modules/enrollment/reducers";
import storage from "./storage";

export type RootState = ReturnType<typeof reducer>;

const migrations = {
  0: (state: PersistedState) => {
    if (!state) return state;
    const enrollments = (state as Record<string, unknown>).enrollments as
      | Record<string, unknown>
      | undefined;
    return {
      ...state,
      enrollments: {
        ...enrollments,
        streak: streakDefaultStates,
      },
    };
  },
  1: (state: PersistedState) => {
    if (!state) return state;
    // Migration v1: Add gamification, cohort, and notifications modules
    return {
      ...state,
      gamification: {
        badges: {
          all: [],
          unlocked: [],
          loading: false,
          error: "",
        },
        multipliers: {
          current: null,
          loading: false,
        },
        points: {
          transactions: [],
          loading: false,
        },
        pendingCelebrations: [],
      },
      cohort: {
        current: null,
        list: [],
        members: [],
        loading: false,
        error: "",
      },
      notifications: {
        preferences: null,
        items: [],
        unreadCount: 0,
        loading: false,
        error: "",
      },
    };
  },
};

const persistConfig: PersistConfig<RootState> = {
  key: "root",
  version: 1, // Bumped from 0 to 1 for new modules
  storage,
  debug: true,
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(migrations, { debug: true }),
  blacklist: [
    "books",
    "journals",
    "visions",
    "leaderboard",
    "enrollments",
    "actions",
    "quotes",
    "meditations",
    "histories",
    // New modules (v1) - will have their own persist configs
    "gamification",
    "cohort",
    "notifications",
    "payment",
  ],
};

interface ApiCallPayload {
  onSuccess?: string;
  onError?: string;
  onStart?: string;
  [key: string]: unknown;
}
interface ApiCallAction {
  type: string;
  payload: ApiCallPayload;
}

const persistedReducer = persistReducer<RootState>(persistConfig, reducer);

function configureModifiedStore(): EnhancedStore<RootState> {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(resetDataMiddleware, api),
  });
}

// let storeInstance: EnhancedStore<RootState>;
// if (process.env.NODE_ENV === "development") {
//   if (typeof window !== "undefined") {
//     if (!window.__REDUX_STORE__) {
//       storeInstance = configureModifiedStore();
//       window.__REDUX_STORE__ = storeInstance;
//     } else {
//       storeInstance = window.__REDUX_STORE__;
//     }
//   } else {
//     storeInstance = configureModifiedStore();
//   }
// } else {
//   storeInstance = configureModifiedStore();
// }

export default configureModifiedStore;
export const store = configureModifiedStore();
export const persistor = persistStore(store);

// Dispatch type that properly handles thunks
export type AppThunkDispatch = ThunkDispatch<RootState, unknown, ApiCallAction>;

// This type is intentionally set to ThunkDispatch for proper async thunk support
// The store.dispatch type doesn't include thunk return types by default
export type AppDispatch = ThunkDispatch<RootState, unknown, Action<string>>;

// Thunk action creator type - use this when defining async actions
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
