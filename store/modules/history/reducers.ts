import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { JournalData } from "@resources/types/journal";

interface JournalHistoryState {
  data: JournalData[];
  current: currentJournalType;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}
type currentJournalType = {
  entries: any[];
  entryDate?: string;
  entryType?: string;
  isDailyJournal: boolean;
  isWeeklyJournal: boolean;
  isVisionJournal: boolean;
  isOnboardingInspiration: boolean;
  isOnboardingPotentialSelf: boolean;
};

const initialState: JournalHistoryState = {
  data: [],
  current: {
    entries: [],
    isDailyJournal: false,
    isWeeklyJournal: false,
    isVisionJournal: false,
    isOnboardingInspiration: false,
    isOnboardingPotentialSelf: false,
  },
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "histories",
  initialState,
  reducers: {
    historiesRequested: (state) => {
      state.loading = true;
    },
    historiesRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
    },
    historiesFetched: (state, action: PayloadAction<{ histories: JournalData[] }>) => {
      state.data = action.payload.histories;
      state.lastFetched = new Date().getTime();
      state.loading = false;
    },
    userDailyHistoryFetched: (state, action: PayloadAction<{ histories: JournalData[] }>) => {
      state.current.entries = action.payload.histories;
      state.loading = false;
    },
    setHistoryCurrentStates: (state, action) => {
      state.current = { ...action.payload, entries: [] };
    },
    resetHistoryCurrentState: (state) => {
      state.current = {
        entries: [],
        isDailyJournal: false,
        isWeeklyJournal: false,
        isVisionJournal: false,
        isOnboardingInspiration: false,
        isOnboardingPotentialSelf: false,
      };
    },
    resetHistoryLastFetch: (state) => {
      state.lastFetched = 0;
      state.loading = false;
    },
  },
});

export default slice;
