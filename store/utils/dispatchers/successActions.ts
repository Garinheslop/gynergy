import { successReducerTypes } from "@store/resources/reducerActionTypes";
import { AppDispatch } from "@store/configureStore";
import { editorContentCreated } from "@store/modules/editor";
import { resetHistoryLastFetch } from "@store/modules/history";
import { resetLeaderboardLastFetch } from "@store/modules/leaderboard";

// Middleware dispatcher function
export const dispatchOnSuccessAction = (
  dispatch: AppDispatch,
  onSuccess: string,
  payload: Record<string, unknown>
): void => {
  dispatch({ type: onSuccess, payload: payload });

  switch (onSuccess) {
    case successReducerTypes.userAuthenticated: {
      // Authentication handled elsewhere
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
      const actionPayload = payload as {
        action?: { isCompleted?: boolean };
        journal?: { isCompleted?: boolean };
      };
      dispatch(
        editorContentCreated({
          isCompleted: actionPayload?.action?.isCompleted ?? actionPayload?.journal?.isCompleted,
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
