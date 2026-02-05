import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { JournalDataFields } from "@resources/types/journal";

type currentJournalType = {
  entries: JournalDataFields[];
  isDailyJournal: boolean;
  isWeeklyJournal: boolean;
  isVisionJournal: boolean;
};

interface JournalState {
  data: JournalDataFields[];
  current: currentJournalType;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: JournalState = {
  data: [],
  current: {
    entries: [],
    isDailyJournal: false,
    isWeeklyJournal: false,
    isVisionJournal: false,
  },
  lastFetched: 0,
  fetched: false,
  loading: false,
  creating: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "journals",
  initialState,
  reducers: {
    journalRequested: (state) => {
      state.loading = true;
    },
    journalCreationRequested: (state) => {
      state.creating = true;
    },
    journalUpdateRequested: (state) => {
      state.updating = true;
    },
    journalRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
      state.creating = false;
    },
    journalFetched: (state, action: PayloadAction<{ journals: JournalDataFields[] }>) => {
      state.data = action.payload.journals;
      state.lastFetched = new Date().getTime();
      state.fetched = true;
      state.loading = false;
    },
    journalCreated: (state, action: PayloadAction<{ journal: JournalDataFields }>) => {
      state.data = state.data.concat(action.payload.journal);
      state.fetched = true;
      state.loading = false;
      state.creating = false;
    },
    journalUpdated: (state, action: PayloadAction<{ journals: JournalDataFields[] }>) => {
      state.data = action.payload.journals;
      state.loading = false;
    },
    setJournalCurrentStates: (state, action) => {
      state.current = { ...action.payload, entries: [] };
    },
    userJournalsFetched: (state, action: PayloadAction<{ journals: JournalDataFields[] }>) => {
      state.current.entries = action.payload.journals;
      state.loading = false;
    },
  },
});

export default slice;
