import { profileRequestTypes } from "@resources/types/profile";
import * as urls from "../../configs/urls";
import enrollments from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { AppDispatch } from "@store/configureStore";
import { BookEnrollmentData, booksRequestTypes } from "@resources/types/book";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { enrollmentRequestTypes } from "@resources/types/enrollment";
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  bookEnrollmentRequested,
  bookEnrollmentRequestFailed,
  bookEnrollmentFetched,
  userBookEnrollmentFetched,
  userEnrolled,
  bookEnrollmentResetRequested,
  userEnrollmentReset,
  //streak
  streakRequested,
  streakRequestFailed,
  userStreakUpdated,
} = enrollments.actions;

export const { updateTotalPoints } = enrollments.actions;

export default enrollments.reducer;

export const getUserBookSessionData = (bookId: string) =>
  apiCallBegan({
    url: `${urls.books}/${booksRequestTypes.userCurrentBookSession}?bookId=${bookId}`,
    onStart: bookEnrollmentRequested.type,
    onSuccess: userBookEnrollmentFetched.type,
    onError: bookEnrollmentRequestFailed.type,
  });

export const enrollUserToBookSession = (bookId: string) =>
  apiCallBegan({
    url: `${urls.books}/${booksRequestTypes.bookEnrollment}`,
    data: {
      bookId,
    },
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    method: "POST",
    onStart: bookEnrollmentRequested.type,
    onSuccess: userEnrolled.type,
    onError: bookEnrollmentRequestFailed.type,
  });
export const resetUserBookSessionData = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.books}/${booksRequestTypes.resetUserBookSession}`,
    data: {
      sessionId,
    },
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    method: "PUT",
    onStart: bookEnrollmentResetRequested.type,
    onSuccess: userEnrollmentReset.type,
    onError: bookEnrollmentRequestFailed.type,
  });

///streak
export const updateUserStreak = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.enrollments}/${enrollmentRequestTypes.recalculateUserStreak}`,
    data: {
      sessionId,
    },
    method: "PUT",
    onStart: streakRequested.type,
    onSuccess: userStreakUpdated.type,
    onError: streakRequestFailed.type,
  });
