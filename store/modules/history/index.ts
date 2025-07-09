import * as urls from "../../configs/urls";
import histories from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { historyRequestTypes } from "@resources/types/history";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const { historiesRequested, historiesRequestFailed, historiesFetched, userDailyHistoryFetched } =
  histories.actions;

export const { setHistoryCurrentStates, resetHistoryCurrentState, resetHistoryLastFetch } =
  histories.actions;

export default histories.reducer;

export const getUserJournalhistories = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.history}/${historyRequestTypes.userJournalHistory}?sessionId=${sessionId}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    method: "GET",
    onStart: historiesRequested.type,
    onSuccess: historiesFetched.type,
    onError: historiesRequestFailed.type,
  });

export const getUserDailyHistory = ({
  sessionId,
  historyType,
  entryDate,
  historyRequestType,
}: {
  sessionId: string;
  historyType: string;
  entryDate: string;
  historyRequestType: string;
}) =>
  apiCallBegan({
    url: `${urls.history}/${historyRequestType}?sessionId=${sessionId}&historyType=${historyType}&entryDate=${entryDate}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: historiesRequested.type,
    onSuccess: userDailyHistoryFetched.type,
    onError: historiesRequestFailed.type,
  });
