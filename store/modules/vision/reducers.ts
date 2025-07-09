import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BookEnrollmentData } from "@resources/types/book";
import { UserVision, visionTypes } from "@resources/types/vision";

interface VisionState {
  data: UserVision[];
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  completed: boolean;
  error: string;
}

const initialState: VisionState = {
  data: [],
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  completed: false,
  error: "",
};

const slice = createSlice({
  name: "visions",
  initialState,
  reducers: {
    userVisionRequested: (state) => {
      state.loading = true;
    },
    userVisionUpdateRequested: (state) => {
      state.updating = true;
    },
    userVisionRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
    },
    userVisionFetched: (state, action: PayloadAction<{ visions: UserVision[] }>) => {
      state.data = action.payload.visions;
      if (
        [
          visionTypes.highestSelf,
          visionTypes.creed,
          visionTypes.mantra,
          visionTypes.discovery,
        ].every((type) => action.payload.visions.some((vision) => vision.visionType === type))
      ) {
        state.completed = true;
      }
      state.fetched = true;
      state.loading = false;
    },
    userVisionUpdated: (state, action: PayloadAction<{ vision: UserVision }>) => {
      if (state.data.find((vision) => vision.id === action.payload.vision.id)) {
        state.data = state.data.map((vision) =>
          vision.id === action.payload.vision.id ? action.payload.vision : vision
        );
      } else {
        state.data = state.data.concat(action.payload.vision);
        if (
          [
            visionTypes.highestSelf,
            visionTypes.creed,
            visionTypes.mantra,
            visionTypes.discovery,
          ].every((type) => state.data.some((vision) => vision.visionType === type))
        ) {
          state.completed = true;
        }
      }
      state.loading = false;
    },
  },
});

export default slice;
