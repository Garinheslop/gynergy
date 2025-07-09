import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserMeditation } from "@resources/types/meditation";

interface MeditationState {
  data: UserMeditation[];
  lastFetched: number;
  total: number;
  fetched: boolean;
  loading: boolean;
  creating: boolean;
  fetching: boolean;
  completed: boolean;
  error: string;
}

const initialState: MeditationState = {
  data: [],
  lastFetched: 0,
  total: 0,
  fetched: false,
  loading: false,
  creating: false,
  fetching: false,
  completed: false,
  error: "",
};

const slice = createSlice({
  name: "meditations",
  initialState,
  reducers: {
    userMeditationRequested: (state) => {
      state.loading = true;
    },
    userMeditationUpdateRequested: (state) => {
      state.creating = true;
    },
    userMeditationRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.creating = false;
    },
    userMeditationFetched: (
      state,
      action: PayloadAction<{ meditations: UserMeditation[]; total: number }>
    ) => {
      state.data = action.payload.meditations;
      state.total = action.payload.total;
      state.fetched = true;
      state.loading = false;
    },
    userMeditationCreated: (state, action: PayloadAction<{ meditation: UserMeditation }>) => {
      state.data = state.data.concat(action.payload.meditation);
      state.total = state.total + 1;
      state.loading = false;
      state.creating = false;
    },
  },
});

export default slice;
