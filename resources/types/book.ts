export const booksRequestTypes = {
  userBookSessions: "user-book-sessions",
  latestBookSessions: "latest-book-sessions",
  userCurrentBookSession: "user-current-book-session",
  currentBookSessions: "current-book-sessions",
  bookData: "book-data",
  bookEnrollment: "book-enrollment",

  resetUserBookSession: "reset-user-book-session",
  recalculateUserStreak: "recalculate-user-streak",
};
export const bookEnrollmentRequestTypes = {
  userBookSessions: "user-book-sessions",
  currentBookSessions: "current-book-sessions",
  bookData: "book-data",
};

export interface BookEnrollmentData {
  id: string;
  userId: string;
  session: BookSessionData;

  enrollmentDate: string;

  totalPoints: number;
  morningStreak: number;
  eveningStreak: number;
  gratitudeStreak: number;

  createdAt: string;
}

export interface BookSessionData {
  id: string;
  bookId: string;
  sessionId: string;

  startDate: string;
  endDate: string;

  // Cohort lifecycle (migration 007)
  cohortLabel?: string;
  status?: "upcoming" | "active" | "grace_period" | "completed";
  gracePeriodEnd?: string;
  maxEnrollments?: number;
  isPersonal?: boolean;
  ownerUserId?: string;

  createdAt: string;
}
