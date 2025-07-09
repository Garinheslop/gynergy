import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ActionData, ActionLogData, actionLogTypes, actionTypes } from "@resources/types/action";

interface ActionState {
  data: ActionLogData[];
  current: {
    daily: {
      data: ActionData | null;
      completedOn: number | null;
    };
    weekly: {
      data: ActionData | null;
      completedOn: number | null;
    };
    lastFetched: number;
  };
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: ActionState = {
  data: [],
  current: {
    daily: {
      data: null,
      completedOn: null,
    },
    weekly: {
      data: null,
      completedOn: null,
    },
    lastFetched: 0,
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
  name: "actions",
  initialState,
  reducers: {
    actionRequested: (state) => {
      state.loading = true;
    },
    actionCreationRequested: (state) => {
      state.creating = true;
    },
    actionUpdateRequested: (state) => {
      state.updating = true;
    },
    actionRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
      state.creating = false;
    },
    actionsFetched: (state, action: PayloadAction<{ actions: ActionData[] }>) => {
      const daily = action.payload.actions.find(
        (action) => action.actionType === actionTypes.daily
      );
      const weekly = action.payload.actions.find(
        (action) => action.actionType === actionTypes.weekly
      );
      if (daily) {
        state.current.daily.data = daily;
        state.current.lastFetched = new Date().getTime();
      }
      if (weekly) {
        state.current.weekly.data = weekly;
        state.current.lastFetched = new Date().getTime();
      }
      state.fetched = true;
      state.loading = false;
    },
    actionLogsFetched: (state, action: PayloadAction<{ actions: ActionLogData[] }>) => {
      state.data = action.payload.actions;
      state.lastFetched = new Date().getTime();
      state.fetched = true;
      state.loading = false;
    },
    actionLogCreated: (state, action: PayloadAction<{ action: ActionLogData }>) => {
      state.data = state.data.concat(action.payload.action);
      if (action.payload.action.actionType === actionLogTypes.gratitude) {
        state.current.daily.completedOn = new Date().getTime();
      }
      if (action.payload.action.actionType === actionLogTypes.weeklyChallenge) {
        state.current.weekly.completedOn = new Date().getTime();
      }
      state.loading = false;
      state.updating = false;
      state.creating = false;
    },
    actionUpdated: (state, action: PayloadAction<{ actions: ActionLogData[] }>) => {
      state.data = action.payload.actions;
      state.loading = false;
    },

    setUserActionLogStates: (state, action: PayloadAction<{ daily?: number; weekly?: number }>) => {
      if (action.payload?.daily) {
        state.current.daily.completedOn = action.payload.daily;
      }
      if (action.payload?.weekly) {
        state.current.weekly.completedOn = action.payload.weekly;
      }
    },
  },
});

export default slice;
