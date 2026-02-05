import { Middleware } from "redux";
import { successReducerTypes } from "@store/resources/reducerActionTypes";

interface ActionWithPayload {
  type: string;
  payload?: Record<string, unknown>;
}

const resetDataMiddleware: Middleware =
  ({ getState }) =>
  (next) =>
  (action: unknown) => {
    const typedAction = action as ActionWithPayload;
    const initialAppState = getState();

    if (
      typedAction.type === successReducerTypes.signOutUser ||
      typedAction.type === successReducerTypes.resetEnrollment
    ) {
      const actionWithInitialAppState = {
        ...typedAction,
        payload: initialAppState,
      };
      return next(actionWithInitialAppState);
    }

    return next(action);
  };

export default resetDataMiddleware;
