import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserStats } from "@resources/types/profile";

interface UserProfileState {
  current: (User & Partial<UserStats>) | null;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: UserProfileState = {
  current: null,
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    userProfileRequested: (state) => {
      state.loading = true;
    },
    userProfileUpdateRequested: (state) => {
      state.updating = true;
    },
    userProfileRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
    },
    userProfileFetched: (state, action: PayloadAction<{ user: User }>) => {
      state.current = action.payload.user;
      state.loading = false;
    },
    userProfileUpdated: (state, action: PayloadAction<{ user: User }>) => {
      state.current = action.payload.user;
      state.updating = false;
    },
    setCurrentProfileState: (state, action: PayloadAction<User>) => {
      state.current = action.payload;
    },
    userRemoved: (state) => {
      state.current = null;
      state.lastFetched = 0;
    },
  },
});

export default slice;
