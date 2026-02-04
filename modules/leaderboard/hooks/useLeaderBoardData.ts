import React, { useEffect, useRef } from "react";

import dayjs from "dayjs";

import { useSession } from "@contexts/UseSession";
import useComponentVisible from "@modules/common/hooks/useComponentVisible";
import useOnScreen from "@modules/common/hooks/useOnScreen";
import { RootState } from "@store/configureStore";
import { useDispatch, useSelector } from "@store/hooks";
import {
  getInitialLeaderboardData,
  getLeaderboardData,
  getUserRank,
} from "@store/modules/leaderboard";


const useLeaderBoardData = () => {
  const { session } = useSession();
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const leaderboard = useSelector((state) => state.leaderboard);
  const dispatch = useDispatch();

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const isScrollEnd = useOnScreen(scrollEndRef);

  useEffect(() => {
    if (
      session &&
      userEnrollment?.session?.id &&
      !leaderboard.current.fetching &&
      (!leaderboard.current.fetched || leaderboard.current.filter !== leaderboard.filter)
    ) {
      dispatch(getUserRank(userEnrollment?.session?.id, leaderboard.filter));
    }
    if (
      session &&
      userEnrollment?.session?.id &&
      leaderboard.filter &&
      !leaderboard.loading &&
      !leaderboard.fetching &&
      (!leaderboard.lastFetched ||
        dayjs().diff(leaderboard.lastFetched, "h") > 1 ||
        leaderboard.current.filter !== leaderboard.filter)
    ) {
      dispatch(
        getInitialLeaderboardData({
          sessionId: userEnrollment?.session?.id,
          filter: leaderboard.filter,
          skip: 0,
          limit: 20,
        })
      );
    }
  }, [session, userEnrollment, leaderboard.filter]);

  useEffect(() => {
    if (
      isScrollEnd &&
      userEnrollment?.session?.id &&
      leaderboard.filter &&
      !leaderboard.loading &&
      !leaderboard.fetching &&
      leaderboard.skip < leaderboard.total
    ) {
      dispatch(
        getLeaderboardData({
          sessionId: userEnrollment?.session?.id,
          filter: leaderboard.filter,
          skip: leaderboard.skip,
          limit: 20,
        })
      );
    }
  }, [isScrollEnd]);

  return {
    scrollEndRef,
    leaderboardData: leaderboard.data,
  };
};

export default useLeaderBoardData;
