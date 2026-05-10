import { z } from "zod";

export const callBriefingSchema = z.object({
  context: z
    .string()
    .min(20)
    .max(400)
    .describe(
      "1-2 sentence summary of where this client is in the pipeline and what just happened. Reference SPANCO stage and recent activity.",
    ),
  discoveryQuestions: z
    .array(
      z.object({
        question: z.string().min(8).max(220),
        why: z
          .string()
          .min(8)
          .max(220)
          .describe("Why ask this question for THIS client right now."),
      }),
    )
    .min(2)
    .max(4)
    .describe(
      "Concrete discovery questions to ask THIS client. Anchor on the standard 3 (headcount, AI knowledge, budget) but tailor to their stage and audit findings.",
    ),
  expectedObjections: z
    .array(
      z.object({
        category: z.enum(["content", "budget", "venue", "time", "other"]),
        objection: z.string().min(8).max(180),
        response: z
          .string()
          .min(20)
          .max(280)
          .describe("How to respond — concise, defensible from the audit data."),
      }),
    )
    .min(1)
    .max(4),
  nextStageMove: z
    .object({
      target: z.enum(["S", "P", "A", "N", "C", "O"]),
      what: z
        .string()
        .min(15)
        .max(220)
        .describe(
          "The specific commitment to extract from the prospect to advance to the target stage.",
        ),
    })
    .describe("What 'good' looks like for this call — the next-stage move to land."),
  watchouts: z
    .array(z.string().min(8).max(180))
    .min(0)
    .max(3)
    .describe(
      "Optional risks to flag (e.g., decision-maker not in the call, budget cycle ending, etc.).",
    )
    .default([]),
});

export type CallBriefing = z.infer<typeof callBriefingSchema>;

export const OBJECTION_LABEL: Record<
  CallBriefing["expectedObjections"][number]["category"],
  string
> = {
  content: "Content",
  budget: "Budget",
  venue: "Venue",
  time: "Time",
  other: "Other",
};

export const STAGE_FULL: Record<
  CallBriefing["nextStageMove"]["target"],
  string
> = {
  S: "Suspect",
  P: "Prospect",
  A: "Analysis",
  N: "Negotiation",
  C: "Conclusion",
  O: "Order",
};
