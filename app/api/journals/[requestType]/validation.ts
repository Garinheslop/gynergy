import { z } from "zod";

import { journalRequestTypes } from "@resources/types/journal";

const journalAndActionSchema = z.object({
  // morning and evening
  moodScore: z.number().nullable().optional(),

  // morning
  capturedEssence: z.string().nullable().optional(),
  moodContribution: z.string().nullable().optional(),
  mantra: z.string().nullable().optional(),
  // additional arrays for morning journal.
  affirmations: z.array(z.string()).nullable().optional(),
  gratitudes: z.array(z.string()).nullable().optional(),
  excitements: z.array(z.string()).nullable().optional(),
  // evening
  insight: z.string().nullable().optional(),
  insightImpact: z.string().nullable().optional(),
  changes: z.string().nullable().optional(),
  freeflow: z.any().nullable().optional(),
  dreammagic: z.array(z.string()).nullable().optional(),

  // weekly
  wins: z.string().nullable().optional(),
  challenges: z.string().nullable().optional(),
  lessons: z.string().nullable().optional(),

  // daily action
  reflection: z.string().nullable().optional(),
  obstacles: z.string().nullable().optional(),

  // weekly challenge
  reward: z.string().nullable().optional(),
  motivation: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  focus: z.string().nullable().optional(),

  // evening and weekly challenge
  success: z.string().nullable().optional(),

  // journal and action
  isCompleted: z.boolean().nullable().optional(),
});

export const validateJournalSchema = z
  .object({
    journal: journalAndActionSchema,
    requestType: z.enum([
      journalRequestTypes.createMorningJournal,
      journalRequestTypes.createEveningJournal,
      journalRequestTypes.createWeeklyJournal,
    ]),
  })
  .superRefine((data, ctx) => {
    const { requestType, journal } = data;

    switch (requestType) {
      case journalRequestTypes.createMorningJournal:
        if (
          journal.moodScore === undefined &&
          !journal.moodContribution &&
          !journal.capturedEssence &&
          !journal.mantra
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For a morning journal, provide at least one of mood score, mood contribution, captured essence, and mantra.",
            path: ["journal"],
          });
        }
        if (!journal.affirmations || journal.affirmations.length !== 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Morning journal requires exactly 5 affirmations.",
            path: ["journal", "affirmations"],
          });
        }
        if (!journal.gratitudes || journal.gratitudes.length !== 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Morning journal requires exactly 3 gratitudes.",
            path: ["journal", "gratitudes"],
          });
        }
        if (!journal.excitements || journal.excitements.length !== 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Morning journal requires exactly 3 excitements.",
            path: ["journal", "excitements"],
          });
        }
        break;

      case journalRequestTypes.createEveningJournal:
        if (
          journal.moodScore === undefined &&
          !journal.insight &&
          !journal.insightImpact &&
          !journal.changes &&
          !journal.success
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For an evening journal, provide at least one of mood score, insight, insight impact, changes and success.",
            path: ["journal"],
          });
        }

        if (!journal.dreammagic || journal.dreammagic.length !== 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Morning journal requires exactly 5 dreammagic.",
            path: ["journal", "dreammagic"],
          });
        }
        break;

      case journalRequestTypes.createWeeklyJournal:
        if (!journal.wins || !journal.challenges || !journal.lessons) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "For a weekly journal, provide at least one of wins, challenges and lessons.",
            path: ["journal"],
          });
        }
        break;

      default:
        break;
    }
  });

export type ValidateJournalSchema = z.infer<typeof validateJournalSchema>;
