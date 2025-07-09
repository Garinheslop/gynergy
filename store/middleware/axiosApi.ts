import { Middleware, Dispatch } from "@reduxjs/toolkit";
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
  // Additional properties expected by axiosRequest can be added here
  [key: string]: any;
}

interface ApiCallAction {
  type: string;
  payload: ApiCallPayload;
}

const api: Middleware =
  ({ dispatch, getState }) =>
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
    } catch (error: any) {
      dispatchErrorToasts(dispatch, onError, error);
      // General error action
      dispatch(
        actions.apiCallFailed({
          error: error?.message,
          systemError: error.response?.data,
          status: error.response?.status,
          message: error.response?.data?.error?.message,
        })
      );
      // Specific error action
      if (onError) {
        dispatch({
          type: onError,
          payload: {
            error: error?.message,
            systemError: error.response?.data,
            errors: error.response?.data?.errors,
            status: error.response?.status,
            message: error.response?.data?.error?.message,
          },
        });
      }
    }
  };

export default api;
