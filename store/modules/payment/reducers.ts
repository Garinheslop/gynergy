import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { UserEntitlements } from "@resources/types/payment";

interface FormattedFriendCode {
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

interface FormattedSubscription {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface PaymentState {
  entitlements: UserEntitlements | null;
  friendCodes: FormattedFriendCode[];
  subscription: FormattedSubscription | null;
  loading: boolean;
  error: string | null;
  redeemingCode: boolean;
  redeemError: string | null;
  redeemSuccess: string | null;
}

const initialState: PaymentState = {
  entitlements: null,
  friendCodes: [],
  subscription: null,
  loading: false,
  error: null,
  redeemingCode: false,
  redeemError: null,
  redeemSuccess: null,
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
        friendCodes: FormattedFriendCode[];
        subscription: FormattedSubscription | null;
      }>
    ) {
      state.loading = false;
      state.entitlements = action.payload.entitlements;
      state.friendCodes = action.payload.friendCodes;
      state.subscription = action.payload.subscription;
    },
    fetchEntitlementsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Redeem friend code
    redeemCodeStart(state) {
      state.redeemingCode = true;
      state.redeemError = null;
      state.redeemSuccess = null;
    },
    redeemCodeSuccess(state, action: PayloadAction<string>) {
      state.redeemingCode = false;
      state.redeemSuccess = action.payload;
      // Update entitlements after successful redemption
      if (state.entitlements) {
        state.entitlements.hasChallengeAccess = true;
        state.entitlements.challengeAccessType = "friend_code";
      } else {
        state.entitlements = {
          id: "",
          userId: "",
          hasChallengeAccess: true,
          challengeAccessType: "friend_code",
          challengeAccessGrantedAt: new Date().toISOString(),
          challengeExpiresAt: null,
          hasJournalAccess: false,
          journalSubscriptionId: null,
          hasCommunityAccess: false,
          communityAccessGrantedAt: null,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    redeemCodeFailure(state, action: PayloadAction<string>) {
      state.redeemingCode = false;
      state.redeemError = action.payload;
    },
    clearRedeemStatus(state) {
      state.redeemError = null;
      state.redeemSuccess = null;
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
  redeemCodeStart,
  redeemCodeSuccess,
  redeemCodeFailure,
  clearRedeemStatus,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
