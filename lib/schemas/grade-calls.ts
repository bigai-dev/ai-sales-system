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
        // A plain string, not an enum: the AI often writes "medium impact"
        // (or "High"), and an enum turned that into a failed coaching run.
        // normalizeImpact() maps whatever it wrote onto the three levels.
        impact: z
          .string()
          .describe('Exactly one of: "high impact", "medium impact", "low impact".'),
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

export type ImpactLevel = "high impact" | "medium impact" | "low impact";

/** Map the AI's impact tag ("High", "medium", "low impact"…) to one of three levels. */
export function normalizeImpact(raw: string): ImpactLevel {
  const s = raw.toLowerCase();
  if (s.includes("high")) return "high impact";
  if (s.includes("low")) return "low impact";
  return "medium impact";
}
