import { historyTypes, JournalCardData } from "@resources/types/history";
import { journalTypes } from "@resources/types/journal";
import { RootState } from "@store/configureStore";
import { getUserJournalhistories } from "@store/modules/history";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@store/hooks";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import { getUserMeditations } from "@store/modules/meditation";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

function useGenerateHistoryCards() {
  const dispatch = useDispatch();

  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const histories = useSelector((state) => state.histories);
  const meditations = useSelector((state) => state.meditations);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [historyData, setHistoryData] = useState<JournalCardData[]>([]);
  useEffect(() => {
    if (
      userEnrollment?.session?.id &&
      !histories.lastFetched &&
      dayjs().diff(histories.lastFetched, "h") > 6
    ) {
      dispatch(getUserJournalhistories(userEnrollment?.session?.id));
    }
  }, [userEnrollment]);

  useEffect(() => {
    if (userEnrollment?.session?.id && !meditations.loading && !meditations.fetched) {
      dispatch(getUserMeditations(userEnrollment?.session?.id));
    }
  }, [userEnrollment]);

  // Update history data when histories is fetched
  useEffect(() => {
    if (userEnrollment?.enrollmentDate && currentBook?.durationDays && meditations.fetched) {
      setHistoryData(() =>
        generateData(userEnrollment?.enrollmentDate, currentBook?.durationDays, histories.data)
      );
      setIsLoading(false);
    }
  }, [histories.data, meditations.data, userEnrollment, currentBook]);

  function generateData(startDate: string, duration: number, histories: any[]): any {
    const data: any = [];
    let currentDate = dayjs(new Date(startDate));

    for (let day = 1; day <= duration; day++) {
      const morningCompleted = !histories?.length
        ? false
        : histories.some(
            (entry: any) =>
              dayjs(new Date(entry.entryDate)).isSame(currentDate, "day") &&
              entry?.journalType === journalTypes.morningJournal
          );

      const eveningCompleted = !histories?.length
        ? false
        : histories.some(
            (entry: any) =>
              dayjs(new Date(entry.entryDate)).isSame(currentDate, "day") &&
              entry?.journalType === journalTypes.eveningJournal
          );

      const gratitudeActionCompleted = !histories?.length
        ? false
        : histories.some(
            (entry: any) =>
              dayjs(new Date(entry.entryDate)).isSame(currentDate, "day") &&
              entry?.journalType === journalTypes.gratitudeAction
          );

      data.push({
        isDailyJournal: true,
        day: day,
        entryType: historyTypes.daily,
        entryDate: currentDate.toISOString(),
        morningCompleted,
        eveningCompleted,
        gratitudeActionCompleted,
      });
      if (day >= 7 && day % 7 === 0) {
        const weekNumber = (day - 7) / 7;
        // Define the week range: from (currentDate - 6 days) to currentDate
        const weekStart = currentDate.add(1, "day").startOf("d");
        const weekEnd = weekStart.add(7, "day").endOf("d");

        const weeklyReflectionCompleted = !histories?.length
          ? false
          : histories.some((entry) => {
              const entryDate = dayjs.utc(entry.entryDate);
              return (
                entryDate.isBetween(weekStart, weekEnd, "day", "[]") &&
                entry?.journalType === journalTypes.weeklyReflection
              );
            });

        const weeklyChallengeCompleted = !histories?.length
          ? false
          : histories.some((entry) => {
              const entryDate = dayjs.utc(entry.entryDate);
              return (
                entryDate.isBetween(weekStart, weekEnd, "day", "[]") &&
                entry?.journalType === journalTypes.weeklyChallenge
              );
            });
        const weeklyReflectionEntryDate =
          weeklyReflectionCompleted &&
          histories.find((entry) => {
            const entryDate = dayjs.utc(entry.entryDate);
            return (
              entryDate.isBetween(weekStart, weekEnd, "day", "[]") &&
              entry?.journalType === journalTypes.weeklyReflection
            );
          });
        const weeklyChallengeEntryDate =
          weeklyChallengeCompleted &&
          histories.find((entry) => {
            const entryDate = dayjs.utc(entry.entryDate);
            return (
              entryDate.isBetween(weekStart, weekEnd, "day", "[]") &&
              entry?.journalType === journalTypes.weeklyChallenge
            );
          });

        data.push({
          isWeeklyJournal: true,
          day: day,
          entryType: historyTypes.weeklyReflection,
          entryDate: weeklyReflectionCompleted
            ? dayjs(weeklyReflectionEntryDate?.entryDate).toISOString()
            : null,
          weeklyReflectionCompleted,
        });
        data.push({
          isWeeklyJournal: true,
          day: day,
          entryType: historyTypes.weeklyChallenge,
          entryDate: weeklyChallengeCompleted
            ? dayjs(weeklyChallengeEntryDate?.entryDate).toISOString()
            : null,
          weeklyChallengeCompleted,
        });
      }

      currentDate = currentDate.add(1, "day");
    }
    return data;
  }

  return {
    historyData,
    isLoading,
  };
}

export default useGenerateHistoryCards;
