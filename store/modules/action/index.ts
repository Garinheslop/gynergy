import * as urls from "../../configs/urls";
import actions from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { actionRequestTypes } from "@resources/types/action";
import { AppDispatch } from "@store/configureStore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  actionRequested,
  actionCreationRequested,
  actionRequestFailed,
  actionsFetched,
  actionLogsFetched,
  actionLogCreated,
  setUserActionLogStates,
} = actions.actions;

export default actions.reducer;

export const getUserActions = (enrollmentId: string) =>
  apiCallBegan({
    url: `${urls.actions}/${actionRequestTypes.userActions}?enrollmentId=${enrollmentId}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: actionRequested.type,
    onSuccess: actionsFetched.type,
    onError: actionRequestFailed.type,
  });
export const getUserDailyActionLogs = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.actions}/${actionRequestTypes.userDailyActionLogs}?sessionId=${sessionId}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: actionRequested.type,
    onSuccess: actionLogsFetched.type,
    onError: actionRequestFailed.type,
  });
export const createUserActionLog = ({
  actionId,
  sessionId,
  actionLog,
  images,
  actionRequestType,
}: {
  actionId: string;
  sessionId: string;
  actionLog: any;
  images: any;
  actionRequestType: string;
}) =>
  apiCallBegan({
    url: `${urls.actions}/${actionRequestType}`,
    data: {
      actionId,
      sessionId,
      actionLog,
      images,
    },
    method: "POST",
    onStart: actionCreationRequested.type,
    onSuccess: actionLogCreated.type,
    onError: actionRequestFailed.type,
  });

export const setUserActionLog = (payload: { daily?: number; weekly?: number }) => {
  return (dispatch: AppDispatch) => {
    dispatch(setUserActionLogStates(payload));
    return Promise.resolve();
  };
};
