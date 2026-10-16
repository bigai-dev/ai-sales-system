// The one place user-facing words live. Every label, status word and tone
// mapping imports from here so the sidebar, pages, tour, PDFs and AI prompts
// all say the same thing. Extend here, not in feature files.

// ---------------------------------------------------------------------------
// Deal stages
// ---------------------------------------------------------------------------
// The database keeps the historical single-letter codes; only the words shown
// to people change. Codes never appear on screen.

export type StageCode = "S" | "P" | "A" | "N" | "C" | "O";
/** @deprecated alias kept while older files migrate — use StageCode. */
export type SpancoCode = StageCode;

export const STAGE_CODES: readonly StageCode[] = ["S", "P", "A", "N", "C", "O"];

export type StageInfo = {
  label: string;
  /** One-line meaning, shown under board column headers and in stage pickers. */
  description: string;
  /** Chance of winning, 0–100. */
  chance: number;
  /** After this many days without movement the deal shows up on Today. */
  stuckAfterDays?: number;
  /** What to do when it is stuck. */
  stuckSuggestion?: string;
};

export const STAGE: Record<StageCode, StageInfo> = {
  S: {
    label: "New lead",
    description: "Identified, not yet contacted",
    chance: 10,
  },
  P: {
    label: "Qualified",
    description: "Replied or showed interest, no meeting yet",
    chance: 25,
  },
  A: {
    label: "Discovery",
    description: "Discovery call done: headcount, AI level and budget known",
    chance: 40,
    stuckAfterDays: 5,
    stuckSuggestion: "Generate a proposal to move this to Proposal",
  },
  N: {
    label: "Proposal",
    description: "Proposal sent; content, venue and dates being agreed",
    chance: 60,
    stuckAfterDays: 7,
    stuckSuggestion: "Book a decision call to close the open points",
  },
  C: {
    label: "Negotiation",
    description: "Verbal yes; waiting for payment to lock the date",
    chance: 80,
    stuckAfterDays: 5,
    stuckSuggestion: "Chase the payment so the date is locked",
  },
  O: {
    label: "Won",
    description: "Invoice paid, workshop date locked",
    chance: 100,
  },
};

export const WON_STAGE: StageCode = "O";
export const OPEN_STAGE_CODES: readonly StageCode[] = ["S", "P", "A", "N", "C"];

export function stageLabel(code: StageCode | string | null | undefined): string {
  if (!code) return "—";
  return STAGE[code as StageCode]?.label ?? String(code);
}

export function stageIndex(code: StageCode): number {
  return STAGE_CODES.indexOf(code);
}

/**
 * A client's stage is simply where its deals are: the most advanced open
 * deal; else Won if any deal was won; else New lead.
 */
export function deriveClientStage(
  dealStages: readonly { stage: StageCode | string }[],
): StageCode {
  let best = -1;
  let anyWon = false;
  for (const d of dealStages) {
    const code = d.stage as StageCode;
    if (code === WON_STAGE) {
      anyWon = true;
      continue;
    }
    const i = stageIndex(code);
    if (i > best) best = i;
  }
  if (best >= 0) return STAGE_CODES[best];
  return anyWon ? WON_STAGE : "S";
}

/** `{ code, label }` pair for AI prompts, so the model sees both. */
export function stageForPrompt(code: StageCode | string) {
  return { code, label: stageLabel(code) };
}

/** One-line legend for AI prompts: "S = New lead (identified…); P = …". */
export function stageLegend(): string {
  return STAGE_CODES.map((c) => `${c} = ${STAGE[c].label} (${STAGE[c].description})`).join(
    "; ",
  );
}

/** @deprecated use STAGE[code].label / stageLabel(). */
export const STAGE_NAME: Record<StageCode, string> = Object.fromEntries(
  STAGE_CODES.map((c) => [c, STAGE[c].label]),
) as Record<StageCode, string>;

// ---------------------------------------------------------------------------
// Where a client came from
// ---------------------------------------------------------------------------

export type ClientSource =
  | "referral"
  | "cold_inbound"
  | "event"
  | "linkedin"
  | "warm_intro"
  | "other";

export const SOURCE_LABEL: Record<ClientSource, string> = {
  referral: "Referral",
  cold_inbound: "Cold inbound",
  event: "Event",
  linkedin: "LinkedIn",
  warm_intro: "Warm intro",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
// Mirrors the enum on calls.status. "live", "ended" and "scheduled" are
// historical values kept so old rows still render; nothing writes them now.
export type CallStatus = "live" | "ended" | "scheduled" | "planned" | "completed";

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  planned: "Planned",
  scheduled: "Planned",
  completed: "Completed",
  ended: "Completed",
  live: "In progress",
};
/** @deprecated use CALL_STATUS_LABEL. */
export const STATUS_LABEL = CALL_STATUS_LABEL;

export type CallOutcome =
  | "connected"
  | "no_answer"
  | "voicemail"
  | "rescheduled"
  | "follow_up"
  | "closed_won"
  | "closed_lost";

export const OUTCOME_LABEL: Record<CallOutcome, string> = {
  connected: "Connected",
  no_answer: "No answer",
  voicemail: "Voicemail",
  rescheduled: "Rescheduled",
  follow_up: "Needs follow-up",
  closed_won: "Won",
  closed_lost: "Lost",
};

export const OUTCOME_TONE: Record<CallOutcome, Tone> = {
  connected: "info",
  no_answer: "warn",
  voicemail: "warn",
  rescheduled: "warn",
  follow_up: "info",
  closed_won: "good",
  closed_lost: "bad",
};

// ---------------------------------------------------------------------------
// Readiness check (DB keeps Healthy / At risk / Critical)
// ---------------------------------------------------------------------------

export type ReadinessStatus = "Healthy" | "At risk" | "Critical";

export const READINESS_STATUS_LABEL: Record<ReadinessStatus, string> = {
  Healthy: "Strong",
  "At risk": "Needs work",
  Critical: "Weak",
};

export const READINESS_STATUS_TONE: Record<ReadinessStatus, Tone> = {
  Healthy: "good",
  "At risk": "warn",
  Critical: "bad",
};

/** Same words, but from a 0–100 score (used where only the number is stored). */
export function readinessStatusFromScore(score: number): ReadinessStatus {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At risk";
  return "Critical";
}

export type Severity = "low" | "medium" | "high" | "critical";

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SEVERITY_TONE: Record<Severity, Tone> = {
  low: "good",
  medium: "warn",
  high: "bad",
  critical: "bad",
};

export const AREA_LABEL = {
  tooling: "Tooling",
  practices: "Practices",
  culture: "Culture",
  velocity: "Velocity",
  adoption: "Adoption",
  outcomes: "Outcomes",
} as const;

// ---------------------------------------------------------------------------
// Role play topics (DB and code still say "bucket"; people see "topic")
// ---------------------------------------------------------------------------

export type Topic = "content" | "budget" | "venue" | "time";

export const TOPIC_LABEL: Record<Topic, string> = {
  content: "Content",
  budget: "Budget",
  venue: "Venue",
  time: "Timing",
};

// ---------------------------------------------------------------------------
// Tones → chip classes (the only place these are composed)
// ---------------------------------------------------------------------------

export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

export const TONE_CHIP: Record<Tone, string> = {
  good: "chip chip-good",
  warn: "chip chip-warn",
  bad: "chip chip-bad",
  info: "chip chip-info",
  neutral: "chip",
};
