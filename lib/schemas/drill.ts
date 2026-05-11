import { z } from "zod";

export const DRILL_BUCKETS = ["content", "budget", "venue", "time"] as const;
export type DrillBucket = (typeof DRILL_BUCKETS)[number];

export const DRILL_BUCKET_LABEL: Record<DrillBucket, string> = {
  content: "Content",
  budget: "Budget",
  venue: "Venue",
  time: "Time",
};

export const DRILL_BUCKET_HELP: Record<DrillBucket, string> = {
  content:
    "Concerns about WHAT you teach — depth, relevance, vendor lock-in, post-workshop applicability.",
  budget:
    "Pricing pushback — RM 3,500/pax + 8% SST, PO process, internal approval delays.",
  venue:
    "Logistics — on-site vs remote, travel costs, recording rights, room booking.",
  time:
    "Scheduling — duration, day of week, ERP migration prep, end-of-quarter pressure.",
};

// Output of the scenario-generator. The same shape powers both standalone
// drills (`/training/drills/[bucket]`) and one-shot dry-run moments — only
// the input context differs.
export const scenarioOutputSchema = z.object({
  scenario: z
    .string()
    .min(20)
    .max(280)
    .describe(
      "The verbatim prospect statement that triggers the drill. Quote it as if heard on a real call.",
    ),
  rubric: z
    .array(z.string().min(8).max(160))
    .min(2)
    .max(3)
    .describe(
      "What 'good' looks like — 2-3 short anchors the grader will use to score the rep's reply.",
    ),
});

export type ScenarioOutput = z.infer<typeof scenarioOutputSchema>;

// Output of the response-grader.
export const gradeOutputSchema = z.object({
  grade: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Score the response against the rubric and the workshop's known objection-handling principles. 0 = bad, 100 = exemplary.",
    ),
  feedback: z
    .string()
    .min(10)
    .max(280)
    .describe("One-line specific critique. Reference WHAT the rep said or missed, not generic advice."),
});

export type GradeOutput = z.infer<typeof gradeOutputSchema>;

// Output of the dry-run pack generator (3 moments at once).
export const dryRunPackSchema = z.object({
  moments: z
    .array(
      z.object({
        bucket: z.enum(DRILL_BUCKETS),
        prompt: z.string().min(15).max(280),
        rubric: z.array(z.string().min(8).max(160)).min(2).max(3),
      }),
    )
    .length(3)
    .describe(
      "The 3 hardest opening moments to expect for THIS specific prospect, ordered by likely call-flow position (rapport-break / mid-call objection / closing-line resistance).",
    ),
});

export type DryRunPack = z.infer<typeof dryRunPackSchema>;
