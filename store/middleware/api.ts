import { Middleware } from "@reduxjs/toolkit";
import * as actions from "@store/resources/apiActionTypes";
import { dispatchSuccessToasts, dispatchErrorToasts } from "../utils/dispatchers/toast";
import { dispatchOnSuccessAction } from "../utils/dispatchers/successActions";

interface ApiCallPayload {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: Record<string, unknown>;
  onSuccess?: string;
  onError?: string;
  onStart?: string;
}

interface ApiCallAction {
  type: string;
  payload: ApiCallPayload;
}

const api: Middleware =
  ({ dispatch }) =>
  (next) =>
  async (action: unknown) => {
    const typedAction = action as ApiCallAction;
    if (typedAction.type !== actions.apiCallBegan.type) {
      return next(action);
    }

    const { url, method = "GET", headers, data, onSuccess, onError, onStart } = typedAction.payload;

    if (onStart) {
      dispatch({ type: onStart });
    }
    next(action);

    try {
      const response = await fetch(`/api/${url}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        cache: "no-store",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`${responseData?.error?.message}`);
      }

      // General success action
      dispatch(actions.apiCallSuccess(responseData));
      // Specific success actions

      if (onSuccess) {
        dispatchSuccessToasts(dispatch, onSuccess, responseData);
        dispatchOnSuccessAction(dispatch, onSuccess, responseData);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      dispatchErrorToasts(dispatch, onError, error);
      dispatch(
        actions.apiCallFailed({
          error: errorMessage,
        })
      );
      if (onError) {
        dispatch({
          type: onError,
          payload: {
            error: errorMessage,
          },
        });
      }
    }
  };

export default api;
