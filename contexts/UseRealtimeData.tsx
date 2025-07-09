"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@lib/supabase-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { updateTotalPoints } from "@store/modules/enrollment";
import { useDispatch, useSelector } from "@store/hooks";
import camelcaseKeys from "camelcase-keys";
import { getInitialLeaderboardData, getUserRank } from "@store/modules/leaderboard";
import { getUserJournals } from "@store/modules/journal";
import { getUserDailyActionLogs } from "@store/modules/action";
import { useSession } from "./UseSession";
dayjs.extend(utc);

const UseRealtimeDataContext = createContext({});

export const useRealtimeData = () => useContext(UseRealtimeDataContext);

const UseRealtimeDataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const journals = useSelector((state) => state.journals);
  const actions = useSelector((state) => state.actions);
  const leaderboard = useSelector((state) => state.leaderboard);

  const { session } = useSession();

  const [lastUpdated, setLastUpdated] = useState<any | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .channel("session_enrollments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_enrollments" },
        handleRealTimeData
      )
      .subscribe();
  }, []);

  useEffect(() => {
    if (
      session &&
      lastUpdated &&
      lastUpdated?.session_id === userEnrollment?.session.id &&
      currentBook
    ) {
      if (lastUpdated?.id === userEnrollment?.id) {
        dispatch(
          updateTotalPoints({
            totalPoints:
              (lastUpdated.morning_completion + lastUpdated.evening_completion) *
                currentBook.dailyJournalPoints +
              lastUpdated.gratitude_completion * currentBook.dailyActionPoints +
              lastUpdated.weekly_reflection_completion * currentBook.weeklyJournalPoints +
              lastUpdated.weekly_challenge_completion * currentBook.weeklyActionPoints,
            morningStreak: lastUpdated.morning_streak,
            eveningStreak: lastUpdated.evening_streak,
            gratitudeStreak: lastUpdated.gratitude_streak,
          })
        );
        if (userEnrollment?.session?.id && !journals.loading) {
          dispatch(getUserJournals(userEnrollment?.session.id));
        }
        if (userEnrollment?.session?.id && !actions.loading) {
          dispatch(getUserDailyActionLogs(userEnrollment?.session.id));
        }
      }
      if (leaderboard.filter && !leaderboard.loading && !leaderboard.fetching) {
        dispatch(
          getInitialLeaderboardData({
            sessionId: lastUpdated.session_id,
            filter: leaderboard.filter,
            skip: 0,
            limit: 20,
          })
        );
      }
      if (userEnrollment?.session?.id && !leaderboard.current.fetching) {
        dispatch(getUserRank(userEnrollment?.session?.id, leaderboard.filter));
      }
    }
  }, [lastUpdated]);

  const handleRealTimeData = (payload: any) => {
    setLastUpdated(payload.new);
  };

  return (
    <UseRealtimeDataContext.Provider
      value={
        {
          //states
        }
      }
    >
      {children}
    </UseRealtimeDataContext.Provider>
  );
};

export default UseRealtimeDataContextProvider;

const getLeaderboardMessage = ({
  firstName,
  lastName,
  position,
}: {
  firstName: string;
  lastName: string;
  position: number;
}) => {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const fullName = `${firstName[0].toUpperCase() + firstName.slice(1)} ${
    lastName[0].toUpperCase() + lastName.slice(1)
  }`;
  const pos = getOrdinal(position);

  const leaderboardMessages = [
    `{name} just joined the leaderboard!`,
    `{name} is climbing the leaderboard!`,
    "{name} just moved to the {pos} spot!",
    "{name} is now in the {pos} position!",
    "Congratulations {name} for moving up to leaderboard!",
    "{name} reached {pos} on the leaderboard!",
    "{name} ascended to {pos} rank!",
  ];

  const randomIndex = Math.floor(Math.random() * leaderboardMessages.length);
  const template = leaderboardMessages[randomIndex];
  const message = template.replace(/{name}/g, fullName).replace(/{pos}/g, pos);
  return message;
};
