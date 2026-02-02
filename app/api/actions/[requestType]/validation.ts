import { z } from "zod";

import { actionRequestTypes } from "@resources/types/action";

const actionSchema = z.object({
  // daily action
  note: z.string().nullable().optional(),
  reflection: z.string().nullable().optional(),
  obstacles: z.string().nullable().optional(),

  // weekly challenge
  eulogy: z.string().nullable().optional(),
  reward: z.string().nullable().optional(),
  motivation: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  focus: z.string().nullable().optional(),
  success: z.string().nullable().optional(),
  list: z.string().nullable().optional(),
  draw: z.any().nullable().optional(),
  freeflow: z.any().nullable().optional(),
  journey: z.any().nullable().optional(),

  isCompleted: z.boolean().nullable().optional(),
});

export const validateActionSchema = z
  .object({
    actionLog: actionSchema,
    requestType: z.enum([
      actionRequestTypes.completeDailyAction,
      actionRequestTypes.completeWeeklyChallenge,
    ]),
  })
  .superRefine((data, ctx) => {
    const { requestType, actionLog } = data;

    switch (requestType) {
      case actionRequestTypes.completeDailyAction:
        if (
          actionLog.isCompleted === undefined &&
          !actionLog.reflection &&
          !actionLog.obstacles &&
          !actionLog.list &&
          !actionLog.draw
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For a daily action, provide at least one of isCompleted, reflection and obstacles.",
            path: ["action-log"],
          });
        }
        break;

      case actionRequestTypes.completeWeeklyChallenge:
        if (
          (actionLog.isCompleted === true &&
            !actionLog.reward &&
            !actionLog.motivation &&
            !actionLog.purpose &&
            !actionLog.focus &&
            !actionLog.success) ||
          actionLog.isCompleted === undefined
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For a weekly challenge, provide at least one of reward, motivation, purpose, focus and success.",
            path: ["action-log"],
          });
        }
        break;

      default:
        break;
    }
  });

export type ValidateActionSchema = z.infer<typeof validateActionSchema>;
