import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BookEnrollmentData } from "@resources/types/book";

interface EnrollmentState {
  current: BookEnrollmentData | null;
  data: BookEnrollmentData[] | [];
  streak: streakState;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  resetting: boolean;
  fetching: boolean;
  error: string;
}

interface streakState {
  current: null;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  resetting: boolean;
  fetching: boolean;
  error: string;
}

export const streakDefaultStates = {
  current: null,
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  resetting: false,
  fetching: false,
  error: "",
};

const initialState: EnrollmentState = {
  current: null,
  data: [],
  streak: streakDefaultStates,

  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  resetting: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    bookEnrollmentRequested: (state) => {
      state.loading = true;
    },
    bookEnrollmentResetRequested: (state) => {
      state.resetting = true;
    },
    bookEnrollmentRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
      state.resetting = false;
    },
    bookEnrollmentFetched: (
      state,
      action: PayloadAction<{ enrollments: BookEnrollmentData[] }>
    ) => {
      state.data = action.payload.enrollments;
      state.loading = false;
    },
    userBookEnrollmentFetched: (
      state,
      action: PayloadAction<{ enrollment: BookEnrollmentData }>
    ) => {
      state.current = action.payload.enrollment;
      state.lastFetched = new Date().getTime();
      state.loading = false;
    },
    userEnrolled: (state, action: PayloadAction<{ enrollment: BookEnrollmentData }>) => {
      state.current = action.payload.enrollment;
      state.loading = false;
    },
    userEnrollmentReset: (state, action: PayloadAction<{ enrollment: BookEnrollmentData }>) => {
      state.current = action.payload.enrollment;
      state.resetting = false;
    },
    updateTotalPoints: (
      state,
      action: PayloadAction<{
        totalPoints: number;
        morningStreak: number;
        eveningStreak: number;
        gratitudeStreak: number;
      }>
    ) => {
      if (state.current) {
        state.current.totalPoints = action.payload.totalPoints;
        state.current.morningStreak = action.payload.morningStreak;
        state.current.eveningStreak = action.payload.eveningStreak;
        state.current.gratitudeStreak = action.payload.gratitudeStreak;
      }
    },

    ///streak
    streakRequested: (state) => {
      state.streak.loading = true;
    },

    streakRequestFailed: (state, action: PayloadAction<string>) => {
      state.streak.error = action.payload;
      state.streak.loading = false;
      state.streak.updating = false;
      state.streak.resetting = false;
    },
    userStreakUpdated: (state, action) => {
      state.streak.lastFetched = new Date().getTime();
      state.streak.loading = false;
    },
  },
});

export default slice;
