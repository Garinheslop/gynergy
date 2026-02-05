import axios from "axios";

import { AppDispatch } from "@store/configureStore";

import {
  fetchEntitlementsStart,
  fetchEntitlementsSuccess,
  fetchEntitlementsFailure,
  redeemCodeStart,
  redeemCodeSuccess,
  redeemCodeFailure,
} from "./reducers";

// Fetch user entitlements
export const fetchEntitlements = () => async (dispatch: AppDispatch) => {
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
export const redeemFriendCode = (code: string) => async (dispatch: AppDispatch) => {
  dispatch(redeemCodeStart());

  try {
    const response = await axios.post("/api/payments/friend-code", { code });
    dispatch(redeemCodeSuccess(response.data.message));
    // Refresh entitlements after successful redemption
    // eslint-disable-next-line @typescript-eslint/ban-types
    (dispatch as Function)(fetchEntitlements());
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

// Re-export reducers
export {
  fetchEntitlementsStart,
  fetchEntitlementsSuccess,
  fetchEntitlementsFailure,
  redeemCodeStart,
  redeemCodeSuccess,
  redeemCodeFailure,
  clearRedeemStatus,
  resetPaymentState,
} from "./reducers";

export { default as paymentReducer } from "./reducers";
