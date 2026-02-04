import { useEffect, useState } from "react";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { useSession } from "@contexts/UseSession";
import { BookSessionData } from "@resources/types/book";
import { useDispatch, useSelector } from "@store/hooks";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

function useCheckEnrollmentSession() {
  const dispatch = useDispatch();
  const { session } = useSession();

  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);

  const [isSessionCompleted, setIsSessionCompleted] = useState<boolean>(false);
  const [latestSession, setLatestSession] = useState<BookSessionData | null>(null);

  useEffect(() => {
    if (userEnrollment?.session.id) {
      if (
        dayjs().isAfter(dayjs(userEnrollment?.enrollmentDate).add(currentBook?.durationDays!, "d"))
      ) {
        setIsSessionCompleted(true);
      } else {
        setIsSessionCompleted(false);
      }
      if (currentBook?.latestSession?.id) {
        if (
          currentBook?.latestSession?.id !== userEnrollment?.session.id &&
          currentBook?.latestSession?.bookId === userEnrollment?.session.bookId &&
          dayjs(currentBook?.latestSession.startDate).isAfter(
            dayjs(userEnrollment?.session?.startDate).add(currentBook?.durationDays!, "d")
          )
        ) {
          setLatestSession(currentBook?.latestSession);
        }
      }
    }
  }, [session, currentBook, userEnrollment]);

  return {
    bookSessionCompleted: isSessionCompleted,
    latestBookSession: latestSession,
  };
}

export default useCheckEnrollmentSession;
