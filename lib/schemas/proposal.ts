import { z } from "zod";

// NOTE ON BOUNDS: DeepSeek runs structured output in "compatibility mode" — the
// schema is injected into the prompt as a *hint*, not enforced during decoding.
// So every hard min/max here is a tripwire: if the model writes a rationale 2
// chars under a floor, or a thin audit yields only 2 modules for a day, the
// WHOLE proposal fails validation ("response did not match schema").
//
// We therefore keep only what downstream code actually needs as *hard* rules
// (non-empty strings, non-empty arrays, the venue enum, a positive integer
// cohort size) and express the quality targets (sentence length, 3–5 modules)
// as guidance in .describe(), which the model reads. Ceilings stay but are
// generous, only to stop runaway output from breaking the PDF layout.

const moduleEntry = z.object({
  title: z.string().min(1).max(100),
  rationale: z
    .string()
    .min(1)
    .max(300)
    .describe(
      "One sentence (aim for ~20–220 characters) tying this module to a specific audit finding (e.g. 'Adoption is at 30% — this module standardizes a baseline').",
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
      .min(1)
      .max(600)
      .describe(
        "Why this cohort size, given the team's headcount and AI-knowledge level (aim for 2–4 sentences). Reference audit findings.",
      ),
  }),
  contentSplit: z.object({
    day1Theme: z
      .string()
      .min(1)
      .max(100)
      .describe(
        "Day 1 weighting headline (e.g. 'Tool stack + prompt fluency baseline').",
      ),
    day1Modules: z
      .array(moduleEntry)
      .min(1)
      .max(6)
      .describe("Day 1 modules — aim for 3–5, each tied to a specific audit finding."),
    day2Theme: z
      .string()
      .min(1)
      .max(100)
      .describe(
        "Day 2 weighting headline (e.g. 'Workflow integration + agentic dev guardrails').",
      ),
    day2Modules: z
      .array(moduleEntry)
      .min(1)
      .max(6)
      .describe("Day 2 modules — aim for 3–5, each tied to a specific audit finding."),
  }),
  proposedDates: z
    .array(z.string().min(1).max(90))
    .min(1)
    .max(3)
    .describe(
      "1–3 proposed delivery date options, plain-English (e.g. 'Week of June 9, 2026' or 'Mon–Tue Jun 16–17, 2026').",
    ),
  logistics: z.object({
    venueRecommendation: z.enum(["on_site", "remote", "hybrid"]),
    venueRationale: z
      .string()
      .min(1)
      .max(450)
      .describe(
        "Why this venue style fits the team (aim for 1–3 sentences) — reference distributed/colocated, security posture, retention.",
      ),
  }),
  followUps: z
    .array(z.string().min(1).max(220))
    .min(1)
    .max(4)
    .describe(
      "Post-workshop engagements that compound the workshop's value (e.g. lead-engineer 1:1s, readiness re-audit at 90 days).",
    ),
  nextSteps: z
    .array(z.string().min(1).max(220))
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
