import { z } from "zod";

export const graderSchema = z.object({
  scores: z
    .array(
      z.object({
        label: z.string().describe("e.g. 'Discovery depth', 'Objection handling'"),
        score: z.number().int().min(0).max(100),
      }),
    )
    .min(3)
    .max(5),
  opportunities: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        impact: z.enum(["high impact", "medium", "low impact"]),
      }),
    )
    .min(0)
    .max(4),
  wins: z
    .array(
      z.object({
        prefix: z.string(),
        num: z.string().nullable().optional(),
        suffix: z.string().nullable().optional(),
      }),
    )
    .min(0)
    .max(5),
});

export type GraderOutput = z.infer<typeof graderSchema>;
