export interface UserVision {
  id: string;
  userId: string;
  sessionId: string;

  name?: string;
  abilities?: string;
  purpose?: string;
  traits?: string;
  symbols?: string;

  mantra?: string;
  creed?: string;

  qualities?: string;
  achievements?: string;
  importance?: string;
  selfValues?: string;
  lifestyle?: string;
  foreseen?: string;
  relationships?: string;
  legacy?: string;
  improvement?: string;
  selfEvaluation?: string;
  interests?: string;
  triggers?: string;
  envision?: string;
  milestones?: string;
  contributions?: string;

  isCompleted: boolean;
  visionType: (typeof visionTypes)[keyof typeof visionTypes];

  createdAt: Date;
  updatedAt: Date;
}

export const visionTypes = {
  highestSelf: "highest-self",
  mantra: "mantra",
  creed: "creed",
  discovery: "discovery",
} as const;

export const visionRequestTypes = {
  userVisions: "user-visions",
  updateUserVisions: "update-user-visions",
  //create
  updateVisionHighestSelf: "update-highest-self",
  updateVisionMantra: "update-mantra",
  updateVisionCreed: "update-creed",
  updateVisionDiscovery: "update-discovery",
};

export const visionHighestSelfKeys = ["name", "abilities", "purpose", "traits", "symbols"] as const;
export type VisionHighestSelf = {
  name: string;
  abilities: string;
  purpose: string;
  traits: string;
  symbols: { xMin: number; xMax: number; yMin: number; yMax: number; index: number } | null;
};

export const visionMantraKeys = ["mantra"] as const;
export type VisionMantra = {
  [K in (typeof visionMantraKeys)[number]]: string;
};
export const visionCreedKeys = ["creed"] as const;
export type VisionCreed = {
  [K in (typeof visionCreedKeys)[number]]: string;
};

export type EmblemsCrop = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  index: number;
};

export const visionDiscoveryKeys = [
  "qualities",
  "achievements",
  "importance",
  "selfValues",
  "lifestyle",
  "foreseen",
  "relationships",
  "legacy",
  "improvement",
  "selfEvaluation",
  "interests",
  "triggers",
  "envision",
  "milestones",
  "contributions",
] as const;
export type VisionDiscovery = {
  [K in (typeof visionDiscoveryKeys)[number]]: string;
};
