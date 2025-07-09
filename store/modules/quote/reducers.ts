import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserStats } from "@resources/types/profile";
import { QuotetData } from "@resources/types/quote";

interface dailyQuoteState {
  current: QuotetData | null;
  lastFetched: number;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: dailyQuoteState = {
  current: null,
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "quotes",
  initialState,
  reducers: {
    quoteRequested: (state) => {
      state.loading = true;
    },
    quoteRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
    },
    dailyQuoteFetched: (state, action: PayloadAction<{ quote: QuotetData }>) => {
      state.current = action.payload.quote;
      state.lastFetched = new Date().getTime();
      state.loading = false;
    },
  },
});

export default slice;
