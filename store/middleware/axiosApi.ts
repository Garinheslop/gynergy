import { Middleware } from "@reduxjs/toolkit";
import * as actions from "@store/resources/apiActionTypes";
import { axiosRequest } from "@lib/api/axios";
import {
  dispatchSuccessToasts,
  dispatchErrorToasts,
  dispatchOnSuccessAction,
} from "../utils/dispathcers";

interface ApiCallPayload {
  onSuccess?: string;
  onError?: string;
  onStart?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: Record<string, unknown>;
}

interface ApiCallAction {
  type: string;
  payload: ApiCallPayload;
}

const api: Middleware =
  ({ dispatch, getState: _getState }) =>
  (next) =>
  async (action: unknown) => {
    const typedAction = action as ApiCallAction;
    if (typedAction.type !== actions.apiCallBegan.type) {
      return next(action);
    }

    const { onSuccess, onError, onStart } = typedAction.payload;

    if (onStart) {
      dispatch({ type: onStart, payload: typedAction.payload });
    }
    next(action);
    try {
      const response = await axiosRequest(typedAction.payload);

      // General success action
      dispatch(actions.apiCallSuccess(response.data));
      // Specific success actions
      if (onSuccess) {
        dispatchSuccessToasts(dispatch, onSuccess, response);
        dispatchOnSuccessAction(dispatch, onSuccess, response);
      }
    } catch (error: unknown) {
      const axiosError = error as {
        message?: string;
        response?: { data?: Record<string, unknown>; status?: number };
      };
      dispatchErrorToasts(dispatch, onError, error);
      // General error action
      dispatch(
        actions.apiCallFailed({
          error: axiosError?.message || "Unknown error occurred",
          message: (axiosError.response?.data?.error as { message?: string })?.message,
        })
      );
      // Specific error action
      if (onError) {
        dispatch({
          type: onError,
          payload: {
            error: axiosError?.message || "Unknown error occurred",
            systemError: axiosError.response?.data,
            errors: axiosError.response?.data?.errors,
            status: axiosError.response?.status,
            message: (axiosError.response?.data?.error as { message?: string })?.message,
          },
        });
      }
    }
  };

export default api;
