import { z } from "zod";

export const callDebriefSchema = z.object({
  outcome: z
    .enum([
      "connected",
      "no_answer",
      "voicemail",
      "rescheduled",
      "follow_up",
      "closed_won",
      "closed_lost",
    ])
    .describe("Top-level outcome of the call from the rep's notes."),
  summary: z
    .string()
    .min(20)
    .max(400)
    .describe("2-3 sentence neutral summary of what was discussed."),
  objectionsRaised: z
    .array(
      z.object({
        category: z.enum(["content", "budget", "venue", "time", "other"]),
        verbatim: z
          .string()
          .min(5)
          .max(220)
          .describe(
            "The actual objection as the rep captured it. Stay close to the rep's wording.",
          ),
      }),
    )
    .max(6)
    .default([]),
  commitments: z
    .array(
      z.object({
        who: z.enum(["rep", "client"]),
        what: z.string().min(5).max(220),
      }),
    )
    .max(6)
    .describe("Concrete things either side promised to do.")
    .default([]),
  nextStep: z
    .string()
    .min(8)
    .max(240)
    .describe(
      "ONE clear next step the rep should take, with timing if possible (e.g. 'Send proposal by Friday').",
    ),
  suggestedStage: z
    .enum(["S", "P", "A", "N", "C", "O"])
    .describe(
      "Suggested SPANCO stage to move the deal to. Same stage as before is OK if no movement happened.",
    ),
  coachingNote: z
    .string()
    .min(15)
    .max(280)
    .describe(
      "One observation about HOW the rep handled the call — strength to repeat or gap to fix. Be specific.",
    ),
});

export type CallDebrief = z.infer<typeof callDebriefSchema>;

export const OUTCOME_LABEL: Record<CallDebrief["outcome"], string> = {
  connected: "Connected",
  no_answer: "No answer",
  voicemail: "Voicemail",
  rescheduled: "Rescheduled",
  follow_up: "Needs follow-up",
  closed_won: "Closed-won",
  closed_lost: "Closed-lost",
};

export const OUTCOME_TONE: Record<
  CallDebrief["outcome"],
  "good" | "warn" | "bad" | "info"
> = {
  connected: "info",
  no_answer: "warn",
  voicemail: "warn",
  rescheduled: "warn",
  follow_up: "info",
  closed_won: "good",
  closed_lost: "bad",
};
