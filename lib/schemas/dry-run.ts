import { z } from "zod";

// One scenario in the pre-call dry run pack. The pack always has 3 moments
// because Dry Run is meant to be a tight, ~2-minute drill, not a full
// rehearsal. The bucket field maps each moment to one of the existing
// objection categories so the grader and downstream Playbook agree.
export const dryRunMomentSchema = z.object({
  momentId: z.string().min(8),
  bucket: z.enum(["content", "budget", "venue", "time"]),
  prompt: z
    .string()
    .min(15)
    .max(280)
    .describe("The hardest opening exchange to expect for THIS specific prospect."),
  rubric: z
    .array(z.string().min(8).max(160))
    .min(2)
    .max(3)
    .describe("Brief 'what good looks like' anchors the grader uses."),
  repResponse: z.string().max(800).default(""),
  grade: z.number().int().min(0).max(100).nullable().default(null),
  feedback: z.string().max(280).default(""),
});

export type DryRunMoment = z.infer<typeof dryRunMomentSchema>;

export const callDryRunSchema = z.object({
  generatedAt: z.number().int(),
  takeaway: z
    .string()
    .max(280)
    .default("")
    .describe(
      "One-sentence reminder to take into the live call. Empty until all 3 moments are graded.",
    ),
  moments: z.array(dryRunMomentSchema).length(3),
});

export type CallDryRun = z.infer<typeof callDryRunSchema>;
