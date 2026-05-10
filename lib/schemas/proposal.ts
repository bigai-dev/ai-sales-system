import { z } from "zod";

const moduleEntry = z.object({
  title: z.string().min(3).max(80),
  rationale: z
    .string()
    .min(20)
    .max(220)
    .describe(
      "One sentence tying this module to a specific audit finding (e.g. 'Adoption is at 30% — this module standardizes a baseline').",
    ),
});

export const proposalSchema = z.object({
  cohortRecommendation: z.object({
    size: z
      .number()
      .int()
      .min(1)
      .max(50)
      .describe(
        "Number of attendees in this workshop cohort. Cap at 35; for larger teams, propose this as cohort 1 of N and explain in rationale.",
      ),
    rationale: z
      .string()
      .min(40)
      .max(400)
      .describe(
        "Why this cohort size, given the team's headcount and AI-knowledge level. Reference audit findings.",
      ),
  }),
  contentSplit: z.object({
    day1Theme: z
      .string()
      .min(5)
      .max(80)
      .describe(
        "Day 1 weighting headline (e.g. 'Tool stack + prompt fluency baseline').",
      ),
    day1Modules: z.array(moduleEntry).min(3).max(6),
    day2Theme: z
      .string()
      .min(5)
      .max(80)
      .describe(
        "Day 2 weighting headline (e.g. 'Workflow integration + agentic dev guardrails').",
      ),
    day2Modules: z.array(moduleEntry).min(3).max(6),
  }),
  proposedDates: z
    .array(z.string().min(3).max(60))
    .min(1)
    .max(3)
    .describe(
      "1–3 proposed delivery date options, plain-English (e.g. 'Week of June 9, 2026' or 'Mon–Tue Jun 16–17, 2026').",
    ),
  logistics: z.object({
    venueRecommendation: z.enum(["on_site", "remote", "hybrid"]),
    venueRationale: z
      .string()
      .min(20)
      .max(300)
      .describe(
        "Why this venue style fits the team — reference distributed/colocated, security posture, retention.",
      ),
  }),
  followUps: z
    .array(z.string().min(10).max(160))
    .min(1)
    .max(4)
    .describe(
      "Post-workshop engagements that compound the workshop's value (e.g. lead-engineer 1:1s, readiness re-audit at 90 days).",
    ),
  nextSteps: z
    .array(z.string().min(10).max(160))
    .min(1)
    .max(4)
    .describe(
      "Concrete actions for the prospect to take next to confirm and lock in the workshop.",
    ),
});

export type ProposalOutput = z.infer<typeof proposalSchema>;

export const VENUE_LABEL: Record<ProposalOutput["logistics"]["venueRecommendation"], string> = {
  on_site: "On-site at client office",
  remote: "Remote (Zoom / Meet)",
  hybrid: "Hybrid (on-site + remote dial-in)",
};
