import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "globalStates",
  initialState: {
    isBodyPositionFixed: false,
    hideBookMessage: false,
  },
  reducers: {
    setMainBodyPositionToFixed: (globalStates, action) => {
      globalStates.isBodyPositionFixed = true;
    },
    setMainBodyPositionToRelative: (globalStates, action) => {
      globalStates.isBodyPositionFixed = false;
    },

    setHideBookMessageState: (state) => {
      state.hideBookMessage = true;
    },
  },
});

export const {
  setMainBodyPositionToFixed,
  setMainBodyPositionToRelative,
  setHideBookMessageState,
} = slice.actions;
export default slice.reducer;
