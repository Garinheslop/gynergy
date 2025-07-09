export type EnrollmentDBResponseData = {
  enrollment_date: any;
  session: {
    id: any;
    book: {
      id: any;
    };
  };
};
export const enrollmentRequestTypes = {
  recalculateUserStreak: "recalculate-user-streak",
};
