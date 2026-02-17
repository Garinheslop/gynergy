import axios from "axios";

import type { AppThunk } from "@store/configureStore";

import {
  fetchEntitlementsStart,
  fetchEntitlementsSuccess,
  fetchEntitlementsFailure,
  redeemCodeStart,
  redeemCodeSuccess,
  redeemCodeFailure,
  fetchSubscriptionStart,
  fetchSubscriptionSuccess,
  fetchSubscriptionFailure,
  cancelSubscriptionStart,
  cancelSubscriptionDone,
} from "./reducers";

// Fetch user entitlements
export const fetchEntitlements =
  (): AppThunk =>
  async (dispatch): Promise<void> => {
    dispatch(fetchEntitlementsStart());

    try {
      const response = await axios.get("/api/payments/entitlements");
      dispatch(fetchEntitlementsSuccess(response.data));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError.response?.data?.error || "Failed to fetch entitlements";
      dispatch(fetchEntitlementsFailure(message));
    }
  };

// Redeem friend code
export const redeemFriendCode =
  (code: string): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    dispatch(redeemCodeStart());

    try {
      const response = await axios.post("/api/payments/friend-code", { code });
      dispatch(redeemCodeSuccess(response.data.message));
      // Refresh entitlements after successful redemption
      dispatch(fetchEntitlements());
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError.response?.data?.error || "Failed to redeem friend code";
      dispatch(redeemCodeFailure(message));
      return { success: false, error: message };
    }
  };

// Validate friend code (without redeeming)
export const validateFriendCode = async (
  code: string
): Promise<{ valid: boolean; reason?: string; message?: string }> => {
  try {
    const response = await axios.put("/api/payments/friend-code", { code });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    return { valid: false, reason: axiosError.response?.data?.error || "Failed to validate code" };
  }
};

// Create checkout session
export const createCheckoutSession = async (
  productType: "challenge" | "journal_monthly" | "journal_annual"
): Promise<{ checkoutUrl: string; sessionId: string }> => {
  const response = await axios.post("/api/payments/create-checkout", { productType });
  return response.data;
};

// Fetch full subscription details (plan, invoices, billing)
export const fetchSubscriptionDetails =
  (): AppThunk =>
  async (dispatch): Promise<void> => {
    dispatch(fetchSubscriptionStart());

    try {
      const response = await axios.get("/api/payments/subscription");
      dispatch(
        fetchSubscriptionSuccess({
          subscription: response.data.subscription,
          invoices: response.data.invoices || [],
        })
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError.response?.data?.error || "Failed to fetch subscription details";
      dispatch(fetchSubscriptionFailure(message));
    }
  };

// Cancel subscription
export const cancelUserSubscription =
  (immediate = false): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    dispatch(cancelSubscriptionStart());

    try {
      await axios.delete("/api/payments/subscription", {
        data: { immediate },
      });
      dispatch(cancelSubscriptionDone());
      // Refresh both entitlements and subscription details
      dispatch(fetchEntitlements());
      dispatch(fetchSubscriptionDetails());
      return { success: true };
    } catch (error: unknown) {
      dispatch(cancelSubscriptionDone());
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError.response?.data?.error || "Failed to cancel subscription";
      return { success: false, error: message };
    }
  };

// Resume subscription (undo cancellation)
export const resumeUserSubscription =
  (): AppThunk<Promise<{ success: boolean; error?: string }>> =>
  async (dispatch) => {
    dispatch(cancelSubscriptionStart());

    try {
      await axios.put("/api/payments/subscription");
      dispatch(cancelSubscriptionDone());
      dispatch(fetchEntitlements());
      dispatch(fetchSubscriptionDetails());
      return { success: true };
    } catch (error: unknown) {
      dispatch(cancelSubscriptionDone());
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError.response?.data?.error || "Failed to resume subscription";
      return { success: false, error: message };
    }
  };

// Re-export reducers
export {
  fetchEntitlementsStart,
  fetchEntitlementsSuccess,
  fetchEntitlementsFailure,
  redeemCodeStart,
  redeemCodeSuccess,
  redeemCodeFailure,
  clearRedeemStatus,
  fetchSubscriptionStart,
  fetchSubscriptionSuccess,
  fetchSubscriptionFailure,
  cancelSubscriptionStart,
  cancelSubscriptionDone,
  resetPaymentState,
} from "./reducers";

export type { SubscriptionDetails, Invoice } from "./reducers";

export { default as paymentReducer } from "./reducers";
