import { VisionCreed, VisionDiscovery, VisionHighestSelf, VisionMantra } from "./vision";

export const journalTypes = {
  morningJournal: "morning",
  eveningJournal: "evening",
  gratitudeAction: "gratitude",
  weeklyReflection: "weekly",
  weeklyChallenge: "weekly-challenge",
} as const;

export const journalEntryTypes = {
  affirmation: "affirmation",
  gratitude: "gratitude",
  excitement: "excitement",
  dreammagic: "dream",
} as const;

export const journalRequestTypes = {
  journals: "journals",
  userDailyJournals: "user-daily-journals",
  actionLogs: "action-logs",
  weeklyJournals: "weekly-journals",
  weeklyChallenge: "weekly-challenge",

  // Read
  getUserJournalHistory: "user-journal-history",

  // Create
  createMorningJournal: "create-morning-journal",
  createEveningJournal: "create-evening-journal",
  createWeeklyJournal: "create-weekly-journal",

  // Update
  updateJournal: "update-journal",

  // Delete
  deleteJournal: "delete-journal",
};
export const actionRequestTypes = {
  completeDailyAction: "complete-daily-action",
};

export interface JournalDataFields {
  id: string;
  sessionId: string;
  bookId?: string;
  userId: string;

  entryDate: string;

  capturedEssence?: string;
  moodScore?: number;
  moodContribution?: string;
  mantra?: string;

  insight?: string;
  insightImpact?: string;
  success?: string;
  changes?: string;
  freeflow?: string;

  wins?: string;
  challenges?: string;
  lessons?: string;

  journalType: string;
  isCompleted?: boolean;

  createdAt: string;
}
export const morningJournalKeys = [
  "moodScore",
  "isDreamt",
  "capturedEssence",
  "moodContribution",
  "mantra",
  "affirmations",
  "gratitudes",
  "excitements",
] as const;

export type MorningJournalData = {
  moodScore: number;
  isDreamt: boolean;
  capturedEssence: string | null;
  moodContribution: string | null;
  mantra: string | null;
  affirmations: any[];
  gratitudes: any[];
  excitements: any[];
};
export const eveningJournalKeys = [
  "moodScore",
  "insight",
  "insightImpact",
  "success",
  "changes",
  "dreammagic",
  "freeflow",
] as const;
export type EveningJournalData = {
  moodScore: number;
  insight: string | null;
  insightImpact: string | null;
  success: string | null;
  changes: string | null;
  freeflow: string | null;
  dreammagic: any[];
};

export type WeeklyJournalData = {
  wins: string | null;
  challenges: string | null;
  lessons: string | null;
};

export type DailyChallengeData = {
  isCompleted: boolean;
  note: string | null;
  reflection: string | null;
  obstacles: string | null;
  list?: string;
  draw?: string;
};

export type WeeklyChallengeData = {
  isCompleted: boolean;
  eulogy: string | null;
  reward: string | null;
  motivation: string | null;
  purpose: string | null;
  success: string | null;
  focus: string | null;
  freeflow: string | null;
  journey: JourneyTableData;
};

export interface JourneyTableData {
  // Group 1: My Current Situation / My Vision
  romanticRelationshipSituation: string;
  romanticRelationshipVision: string;
  familyFriendSituation: string;
  familyFriendVision: string;
  qualityOfLifeSituation: string;
  qualityOfLifeVision: string;
  spiritualSituation: string;
  spiritualVision: string;

  // Group 1: Why I Want It / My Strategy
  romanticRelationshipWhy: string;
  romanticRelationshipStrategy: string;
  familyFriendWhy: string;
  familyFriendStrategy: string;
  qualityOfLifeWhy: string;
  qualityOfLifeStrategy: string;
  spiritualWhy: string;
  spiritualStrategy: string;

  // Group 2: My Current Situation / My Vision
  healthFitnessSituation: string;
  healthFitnessVision: string;
  personalDevSituation: string;
  personalDevVision: string;
  careerBusinessSituation: string;
  careerBusinessVision: string;
  financialSituation: string;
  financialVision: string;

  // Group 2: Why I Want It / My Strategy
  healthFitnessWhy: string;
  healthFitnessStrategy: string;
  personalDevWhy: string;
  personalDevStrategy: string;
  careerBusinessWhy: string;
  careerBusinessStrategy: string;
  financialWhy: string;
  financialStrategy: string;
}

export type JournalData =
  | MorningJournalData
  | EveningJournalData
  | WeeklyJournalData
  | DailyChallengeData
  | WeeklyChallengeData
  | VisionHighestSelf
  | VisionMantra
  | VisionCreed
  | VisionDiscovery;
export type EditorData =
  | MorningJournalData
  | EveningJournalData
  | WeeklyJournalData
  | DailyChallengeData
  | WeeklyChallengeData
  | VisionHighestSelf
  | VisionMantra
  | VisionCreed
  | VisionDiscovery;
