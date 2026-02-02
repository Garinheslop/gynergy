import { z } from "zod";

import { visionRequestTypes } from "@resources/types/vision";

export const userVisionSchema = z.object({
  name: z.string().nullable().optional(),
  abilities: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  traits: z.string().nullable().optional(),
  symbols: z.any().nullable().optional(),

  mantra: z.string().nullable().optional(),

  creed: z.string().nullable().optional(),

  qualities: z.string().nullable().optional(),
  achievements: z.string().nullable().optional(),
  importance: z.string().nullable().optional(),
  selfValues: z.string().nullable().optional(),
  lifestyle: z.string().nullable().optional(),
  foreseen: z.string().nullable().optional(),
  relationships: z.string().nullable().optional(),
  legacy: z.string().nullable().optional(),
  improvement: z.string().nullable().optional(),
  selfEvaluation: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
  triggers: z.string().nullable().optional(),
  envision: z.string().nullable().optional(),
  milestones: z.string().nullable().optional(),
  contributions: z.string().nullable().optional(),
});

export const validateVisionSchema = z
  .object({
    vision: userVisionSchema,
    requestType: z.enum([
      visionRequestTypes.updateVisionCreed,
      visionRequestTypes.updateVisionDiscovery,
      visionRequestTypes.updateVisionHighestSelf,
      visionRequestTypes.updateVisionMantra,
    ]),
  })
  .superRefine((data, ctx) => {
    const { requestType, vision } = data;
    switch (requestType) {
      case visionRequestTypes.updateVisionHighestSelf:
        if (
          !vision.name &&
          !vision.abilities &&
          !vision.purpose &&
          !vision.traits &&
          !vision.symbols
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For the vision, provide at least one of name, abilities, purpose, traits and symbols.",
            path: ["vision"],
          });
        }
        break;

      case visionRequestTypes.updateVisionMantra:
        if (!vision.mantra) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "For the vision, provide at mantra.",
            path: ["vision"],
          });
        }
        break;

      case visionRequestTypes.updateVisionCreed:
        if (!vision.creed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "For the vision, provide at creed.",
            path: ["vision"],
          });
        }
        break;

      case visionRequestTypes.updateVisionDiscovery:
        if (
          !vision.qualities &&
          !vision.achievements &&
          !vision.importance &&
          !vision.selfValues &&
          !vision.lifestyle &&
          !vision.foreseen &&
          !vision.relationships &&
          !vision.legacy &&
          !vision.improvement &&
          !vision.selfEvaluation &&
          !vision.interests &&
          !vision.triggers &&
          !vision.envision &&
          !vision.milestones &&
          !vision.contributions
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For a weekly journal, provide at least one of importance , selfValues , lifestyle , foreseen , relationships , legacy , improvement , selfEvaluation, interests , triggers , envision , milestones and contributions.",
            path: ["vision"],
          });
        }
        break;

      default:
        break;
    }
  });

export type ValidateVisionSchema = z.infer<typeof validateVisionSchema>;
