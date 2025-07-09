export const historyTypes = {
  daily: "daily",
  weeklyReflection: "weekly",
  weeklyChallenge: "weekly-challenge",
};

export type JournalCardData = {
  day: number;
  createdAt: string;
  entryType: string;
  entryDate: string;
  isDailyJournal: boolean;
  isWeeklyJournal: boolean;
  isWeeklyChallenge: boolean;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  gratitudeActionCompleted?: boolean;
  weeklyReflectionCompleted?: boolean;
  weeklyChallengeCompleted?: boolean;
};

export type UserData = {
  is_completed: boolean;
  start_date: string;
  end_date: string;
  totalPoints: number;
  creed: string;
  self_values: string;
};

export const historyRequestTypes = {
  userJournalHistory: "user-journal-history",
  userDailyHistory: "user-daily-history",
  userWeeklyHistory: "user-weekly-history",
};
