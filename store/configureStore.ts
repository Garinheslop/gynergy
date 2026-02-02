import {
  Action,
  configureStore,
  EnhancedStore,
  ThunkAction,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore, PersistConfig, createMigrate } from "redux-persist";
import api from "./middleware/api";
import resetDataMiddleware from "./middleware/reset";
import reducer from "@store/reducer";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import { streakDefaultStates } from "./modules/enrollment/reducers";

export type RootState = ReturnType<typeof reducer>;

const migrations = {
  0: (state: any) => {
    return {
      ...state,
      enrollments: {
        ...state.enrollments,
        streak: streakDefaultStates,
      },
    };
  },
  1: (state: any) => {
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
  ],
};

interface ApiCallPayload {
  onSuccess?: string;
  onError?: string;
  onStart?: string;
  [key: string]: any;
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

export type AppThunkDispatch = ThunkDispatch<RootState, any, ApiCallAction>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
