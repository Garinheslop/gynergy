import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { leaderboardFilterTypes, leaderboardUserData } from "@resources/types/leaderboard";

interface LeaderBoardState {
  data: leaderboardUserData[];
  current: {
    userId?: string;
    userRank?: number;
    totalPoints?: number;
    fetched: boolean;
    fetching: boolean;
    filter: string;
  };
  filter: string;
  skip: number;
  total: number;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: LeaderBoardState = {
  data: [],
  current: {
    fetched: false,
    fetching: false,
    filter: leaderboardFilterTypes.session,
  },
  filter: leaderboardFilterTypes.session,
  skip: 0,
  total: 0,
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {
    initialLeaderboardRequested: (state) => {
      state.loading = true;
    },
    leaderboardRequested: (state) => {
      state.fetching = true;
    },
    userLeaderboardDataRequested: (state) => {
      state.current.fetching = true;
    },
    leaderboardRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.fetching = false;
      state.updating = false;
      state.current.fetching = false;
    },
    leaderboardDataFetched: (
      state,
      action: PayloadAction<{
        leaderboard: leaderboardUserData[];
        filter: string;
        total: number;
        skip: number;
      }>
    ) => {
      state.data = action.payload.leaderboard;
      state.current.filter = action.payload.filter;
      state.lastFetched = new Date().getTime();
      state.total = action.payload.total;
      state.skip = action.payload.skip;
      state.loading = false;
    },
    leaderboardDataAdded: (
      state,
      action: PayloadAction<{ leaderboard: leaderboardUserData[]; skip: number }>
    ) => {
      state.data = state.data.concat(action.payload.leaderboard);
      state.skip = action.payload.skip;
      state.fetching = false;
    },
    userLeaderboardDataFetched: (state, action) => {
      state.current = { ...action.payload.rank, fetched: true, fetching: false };
    },
    setLeaderboardFilter: (state, action) => {
      state.filter = action.payload;
    },
    resetLeaderboardLastFetch: (state) => {
      state.lastFetched = 0;
      state.loading = false;
    },
  },
});

export default slice;
