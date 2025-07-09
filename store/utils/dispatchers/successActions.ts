import { Dispatch } from "redux";
import { successReducerTypes } from "@store/resources/reducerActionTypes";
import { AppDispatch } from "@store/configureStore";
import { editorContentCreated } from "@store/modules/editor";
import { resetHistoryLastFetch } from "@store/modules/history";
import { resetLeaderboardLastFetch } from "@store/modules/leaderboard";

// Middleware dispatcher function
export const dispatchOnSuccessAction = (
  dispatch: AppDispatch,
  onSuccess: string,
  payload: any
): void => {
  dispatch({ type: onSuccess, payload: payload });

  switch (onSuccess) {
    case successReducerTypes.userAuthenticated: {
      const userData = payload || {};
      if (userData.authenticated) {
      }
      break;
    }
    case successReducerTypes.signOutUser: {
      break;
    }
    case successReducerTypes.userProfileUpdated: {
      dispatch(resetLeaderboardLastFetch());
      break;
    }
    case successReducerTypes.journalCreated:
    case successReducerTypes.actionLogCreated:
    case successReducerTypes.visionCreated: {
      dispatch(
        editorContentCreated({
          isCompleted: payload?.action?.isCompleted ?? payload?.journal?.isCompleted,
        })
      );
      dispatch(resetHistoryLastFetch());
      break;
    }

    default: {
      break;
    }
  }
};
