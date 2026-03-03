import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { UserEntitlements } from "@resources/types/payment";

interface FormattedSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionDetails {
  id: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  canceledAt: number | null;
  planName: string;
  planAmount: string;
  planInterval: string;
  stripeError?: boolean;
}

export interface Invoice {
  id: string;
  amount: string;
  status: string | null;
  date: number;
  pdfUrl: string | null;
}

interface PaymentState {
  entitlements: UserEntitlements | null;
  subscription: FormattedSubscription | null;
  subscriptionDetails: SubscriptionDetails | null;
  invoices: Invoice[];
  subscriptionLoading: boolean;
  subscriptionError: string | null;
  cancelling: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  entitlements: null,
  subscription: null,
  subscriptionDetails: null,
  invoices: [],
  subscriptionLoading: false,
  subscriptionError: null,
  cancelling: false,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    // Fetch entitlements
    fetchEntitlementsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchEntitlementsSuccess(
      state,
      action: PayloadAction<{
        entitlements: UserEntitlements | null;
        subscription: FormattedSubscription | null;
      }>
    ) {
      state.loading = false;
      state.entitlements = action.payload.entitlements;
      state.subscription = action.payload.subscription;
    },
    fetchEntitlementsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Subscription details
    fetchSubscriptionStart(state) {
      state.subscriptionLoading = true;
      state.subscriptionError = null;
    },
    fetchSubscriptionSuccess(
      state,
      action: PayloadAction<{
        subscription: SubscriptionDetails | null;
        invoices: Invoice[];
      }>
    ) {
      state.subscriptionLoading = false;
      state.subscriptionDetails = action.payload.subscription;
      state.invoices = action.payload.invoices;
    },
    fetchSubscriptionFailure(state, action: PayloadAction<string>) {
      state.subscriptionLoading = false;
      state.subscriptionError = action.payload;
    },

    // Cancel/resume
    cancelSubscriptionStart(state) {
      state.cancelling = true;
    },
    cancelSubscriptionDone(state) {
      state.cancelling = false;
    },

    // Reset on logout
    resetPaymentState() {
      return initialState;
    },
  },
});

export const {
  fetchEntitlementsStart,
  fetchEntitlementsSuccess,
  fetchEntitlementsFailure,
  fetchSubscriptionStart,
  fetchSubscriptionSuccess,
  fetchSubscriptionFailure,
  cancelSubscriptionStart,
  cancelSubscriptionDone,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
