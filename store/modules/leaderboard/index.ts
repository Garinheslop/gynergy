import * as urls from "../../configs/urls";
import leaderboard from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { leaderboardRequestTypes } from "@resources/types/leaderboard";
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  initialLeaderboardRequested,
  leaderboardRequested,
  leaderboardRequestFailed,
  leaderboardDataFetched,
  leaderboardDataAdded,
  userLeaderboardDataRequested,
  userLeaderboardDataFetched,
} = leaderboard.actions;
export const { setLeaderboardFilter, resetLeaderboardLastFetch } = leaderboard.actions;

export default leaderboard.reducer;

export const getInitialLeaderboardData = ({
  sessionId,
  filter,
  skip,
  limit,
}: {
  sessionId: string;
  filter: string;
  skip: number;
  limit: number;
}) =>
  apiCallBegan({
    url: `${urls.leaderboard}/${leaderboardRequestTypes.leaderboardData}?sessionId=${sessionId}&filter=${filter}&skip=${skip}&limit=${limit}&initial=true`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: initialLeaderboardRequested.type,
    onSuccess: leaderboardDataFetched.type,
    onError: leaderboardRequestFailed.type,
  });

export const getLeaderboardData = ({
  sessionId,
  filter,
  skip,
  limit,
}: {
  sessionId: string;
  filter: string;
  skip: number;
  limit: number;
}) =>
  apiCallBegan({
    url: `${urls.leaderboard}/${leaderboardRequestTypes.leaderboardData}?sessionId=${sessionId}&filter=${filter}&skip=${skip}&limit=${limit}&initial=false`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: leaderboardRequested.type,
    onSuccess: leaderboardDataAdded.type,
    onError: leaderboardRequestFailed.type,
  });
export const getUserRank = (sessionId: string, filter: string) =>
  apiCallBegan({
    url: `${urls.leaderboard}/${leaderboardRequestTypes.userRank}?sessionId=${sessionId}&filter=${filter}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: userLeaderboardDataRequested.type,
    onSuccess: userLeaderboardDataFetched.type,
    onError: leaderboardRequestFailed.type,
  });
