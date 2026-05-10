import { z } from "zod";

const status = z.enum(["healthy", "watch", "at_risk", "critical"]);

const metric = z.object({
  name: z.string().describe("Short metric label, e.g. 'Daily AI tool usage'"),
  value: z.string().describe("Formatted value as a string, e.g. '34%' or '5 days'"),
  trend: z.enum(["up", "down", "flat"]).optional(),
  note: z.string().optional(),
});

const dimension = z.object({
  score: z.number().int().min(0).max(100),
  status,
  summary: z.string().min(20).max(400),
  metrics: z.array(metric).min(1).max(6),
});

export const healthCheckSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  overallStatus: status,
  executiveSummary: z
    .string()
    .min(80)
    .max(800)
    .describe(
      "Narrative paragraph naming the 1-2 biggest gaps in the engineering team's AI-coding readiness and the highest-leverage 90-day move.",
    ),
  dimensions: z.object({
    tooling: dimension.describe("Editor + agent stack: Claude Code, Cursor, Copilot, MCP servers, IDE rules, secrets handling."),
    practices: dimension.describe("How AI is woven into PR review, testing, code-gen workflows, prompt hygiene, agent guardrails."),
    culture: dimension.describe("Engineering leadership posture toward AI: skepticism vs enthusiasm, willingness to change workflows, blast-radius tolerance."),
    velocity: dimension.describe("Throughput baselines: cycle time, PRs/dev/week, time-to-merge, deploy frequency."),
    adoption: dimension.describe("Headcount actually using AI tools daily/weekly, license utilization, distribution across teams."),
    outcomes: dimension.describe("Output quality: defect rate, escaped bugs, time-to-feature, dev satisfaction, retention."),
  }),
  risks: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        description: z.string(),
        dimension: z.enum([
          "tooling",
          "practices",
          "culture",
          "velocity",
          "adoption",
          "outcomes",
        ]),
      }),
    )
    .min(0)
    .max(10),
  actions: z
    .array(
      z.object({
        title: z.string().describe("A specific training, workshop, or operational change."),
        priority: z.enum(["p0", "p1", "p2"]),
        owner: z.enum(["eng_lead", "platform", "managers", "individual_devs", "ops"]),
        impact: z.string().describe("Expected outcome in one sentence — measurable where possible."),
        effortWeeks: z.number().int().min(1).max(26),
      }),
    )
    .min(3)
    .max(12),
});

export type HealthCheckOutput = z.infer<typeof healthCheckSchema>;

// ---------- Mappers between LLM output and DB / UI shape ----------

export const STATUS_TO_DB: Record<
  HealthCheckOutput["overallStatus"],
  "Healthy" | "At risk" | "Critical"
> = {
  healthy: "Healthy",
  watch: "Healthy",
  at_risk: "At risk",
  critical: "Critical",
};

export const SEVERITY_TO_TAG: Record<
  "low" | "medium" | "high" | "critical",
  string
> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH RISK",
  critical: "CRITICAL",
};

export const SEVERITY_TO_TONE: Record<
  "low" | "medium" | "high" | "critical",
  "good" | "warn" | "bad"
> = {
  low: "good",
  medium: "warn",
  high: "warn",
  critical: "bad",
};

export const DIMENSION_LABELS: Record<keyof HealthCheckOutput["dimensions"], string> = {
  tooling: "Tooling",
  practices: "Practices",
  culture: "Culture",
  velocity: "Velocity",
  adoption: "Adoption",
  outcomes: "Outcomes",
};
