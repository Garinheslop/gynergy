export const actionTypes = {
  daily: "daily",
  weekly: "weekly",
} as const;

export const actionLogTypes = {
  gratitude: "gratitude",
  weeklyChallenge: "weekly-challenge",
} as const;

export const actionRequestTypes = {
  userDailyActionLog: "daily-action-log",
  userWeeklyActionLog: "weekly-action-log",
  userActions: "user-actions",
  userDailyActionLogs: "user-daily-action-logs",

  completeDailyAction: "complete-daily-action",
  completeWeeklyChallenge: "complete-weekly-challenge",
};
export interface ActionData {
  id: string;
  userId: string;
  bookId: string;

  title: string;
  tip: string;

  hyperlink: string;

  isSelf: boolean;
  isDraw: boolean;
  isList: boolean;
  isMeditation: boolean;
  isJourneyTable: boolean;
  isEulogy: boolean;
  actionType: string;
}
export interface ActionLogData {
  id: string;
  userId: string;
  actionId: number;
  entryDate: string;

  note?: string;
  reflection?: string;
  obstacles?: string;

  eulogy?: string;
  reward?: string;
  motivation?: string;
  purpose?: string;
  success?: string;
  focus?: string;

  list?: string;
  draw?: string;
  freeflow?: string;

  actionType: string;
  isCompleted?: boolean;
  createdAt?: string;
}
