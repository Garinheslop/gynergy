import { useEffect, useState } from "react";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { useSession } from "@contexts/UseSession";
import { BookSessionData, JourneyPhaseKey } from "@resources/types/book";
import { useSelector } from "@store/hooks";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

function useCheckEnrollmentSession() {
  const { session } = useSession();

  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);

  const [isSessionCompleted, setIsSessionCompleted] = useState<boolean>(false);
  const [latestSession, setLatestSession] = useState<BookSessionData | null>(null);
  const [journeyPhase, setJourneyPhase] = useState<JourneyPhaseKey>("challenge");
  const [dayInJourney, setDayInJourney] = useState<number>(1);

  useEffect(() => {
    if (userEnrollment?.session.id && currentBook) {
      const enrollDate = dayjs(userEnrollment.enrollmentDate).startOf("d");
      const currentDay = dayjs().diff(enrollDate, "d") + 1;
      setDayInJourney(currentDay);

      const challengeDays = currentBook.durationDays;
      const bridgeDays = currentBook.bridgeDurationDays ?? 30;
      const totalDays = challengeDays + bridgeDays; // 75

      if (currentDay > totalDays) {
        setJourneyPhase("completed");
        setIsSessionCompleted(true);
      } else if (currentDay > challengeDays + 21) {
        // Days 67-75: Choose Your Path phase
        setJourneyPhase("bridge_choose_path");
        setIsSessionCompleted(false);
      } else if (currentDay > challengeDays) {
        // Days 46-66: Integration phase
        setJourneyPhase("bridge_integration");
        setIsSessionCompleted(false);
      } else {
        // Days 1-45: Core challenge
        setJourneyPhase("challenge");
        setIsSessionCompleted(false);
      }

      // Check if a newer session is available for re-enrollment
      if (currentBook.latestSession?.id) {
        if (
          currentBook.latestSession.id !== userEnrollment.session.id &&
          currentBook.latestSession.bookId === userEnrollment.session.bookId &&
          dayjs(currentBook.latestSession.startDate).isAfter(
            dayjs(userEnrollment.session.startDate).add(totalDays, "d")
          )
        ) {
          setLatestSession(currentBook.latestSession);
        }
      }
    }
  }, [session, currentBook, userEnrollment]);

  return {
    bookSessionCompleted: isSessionCompleted,
    latestBookSession: latestSession,
    journeyPhase,
    dayInJourney,
  };
}

export default useCheckEnrollmentSession;
