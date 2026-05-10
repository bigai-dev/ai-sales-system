import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { ProposalOutput } from "@/lib/schemas/proposal";
import type { CallBriefing } from "@/lib/schemas/call-briefing";
import type { CallDebrief } from "@/lib/schemas/call-debrief";
import type { DecisionMaker } from "@/lib/types/client";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const ts = (n: string) => integer(n, { mode: "number" });
const bool = (n: string) => integer(n, { mode: "boolean" });

// ---------- reps ----------
export const reps = sqliteTable("reps", {
  id: id(),
  name: text("name").notNull(),
  initials: text("initials").notNull().unique(),
  email: text("email").unique(),
  gradient: text("gradient"),
  isPrimary: bool("is_primary").default(false),
  createdAt: ts("created_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

// ---------- clients ----------
export const clients = sqliteTable(
  "clients",
  {
    id: id(),
    name: text("name").notNull().unique(),
    initials: text("initials").notNull(),
    contactName: text("contact_name").notNull(),
    contactRole: text("contact_role"),
    industry: text("industry"),
    size: text("size", { enum: ["SMB", "Mid-market", "Enterprise"] }),
    employees: integer("employees"),
    devCount: integer("dev_count"),
    arrCents: integer("arr_cents").default(0).notNull(),
    stage: text("stage", {
      enum: ["Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Closed-won"],
    })
      .notNull()
      .default("Lead"),
    health: integer("health").default(50).notNull(),
    products: text("products", { mode: "json" }).$type<string[]>().default([]),
    gradient: text("gradient"),
    ownerRepId: text("owner_rep_id").references(() => reps.id),
    lastActivityAt: ts("last_activity_at"),
    // ---- discovery profile (what the client wants) ----
    goals: text("goals"),
    painPoints: text("pain_points"),
    currentStack: text("current_stack", { mode: "json" }).$type<string[]>().default([]),
    decisionMakers: text("decision_makers", { mode: "json" })
      .$type<DecisionMaker[]>()
      .default([]),
    budgetSignal: text("budget_signal"),
    timelineSignal: text("timeline_signal"),
    source: text("source", {
      enum: ["referral", "cold_inbound", "event", "linkedin", "warm_intro", "other"],
    }),
    notes: text("notes"),
    createdAt: ts("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [index("clients_stage_idx").on(t.stage)],
);

// ---------- deals ----------
export const deals = sqliteTable(
  "deals",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    ownerRepId: text("owner_rep_id").references(() => reps.id),
    title: text("title"),
    stage: text("stage", { enum: ["S", "P", "A", "N", "C", "O"] })
      .notNull()
      .default("S"),
    valueCents: integer("value_cents").notNull().default(0),
    probability: integer("probability").default(0).notNull(),
    hot: bool("hot").default(false),
    insight: text("insight"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    nextStep: text("next_step"),
    nextStepAt: ts("next_step_at"),
    headcount: integer("headcount"),
    deliveryDate: ts("delivery_date"),
    lastActivity: text("last_activity"),
    lastActivityAt: ts("last_activity_at"),
    daysInStageStartsAt: ts("days_in_stage_starts_at")
      .$defaultFn(() => Date.now())
      .notNull(),
    closedAt: ts("closed_at"),
    invoiceNumber: text("invoice_number"),
    invoiceIssuedAt: ts("invoice_issued_at"),
    createdAt: ts("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [
    index("deals_stage_idx").on(t.stage),
    index("deals_client_idx").on(t.clientId),
    // Hot WHERE/sort columns for KPIs and Today queue.
    index("deals_closed_at_idx").on(t.closedAt),
    index("deals_invoice_number_idx").on(t.invoiceNumber),
  ],
);

// ---------- script_templates ----------
export const scriptTemplates = sqliteTable("script_templates", {
  id: id(),
  name: text("name").notNull(),
  sections: text("sections", { mode: "json" })
    .$type<{ title: string; hint: string; lines: string[] }[]>()
    .notNull(),
  isDefault: bool("is_default").default(false),
  createdAt: ts("created_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

// ---------- calls ----------
export const calls = sqliteTable(
  "calls",
  {
    id: id(),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
    repId: text("rep_id").references(() => reps.id),
    title: text("title"),
    status: text("status", {
      enum: ["live", "ended", "scheduled", "planned", "completed"],
    })
      .default("planned")
      .notNull(),
    scriptTemplateId: text("script_template_id").references(() => scriptTemplates.id),
    scheduledAt: ts("scheduled_at"),
    startedAt: ts("started_at")
      .$defaultFn(() => Date.now())
      .notNull(),
    endedAt: ts("ended_at"),
    talkPct: integer("talk_pct"),
    questionsAsked: integer("questions_asked").default(0).notNull(),
    sentiment: integer("sentiment").default(0).notNull(),
    stageHint: text("stage_hint"),
    summary: text("summary"),
    briefing: text("briefing", { mode: "json" }).$type<CallBriefing>(),
    notes: text("notes"),
    debrief: text("debrief", { mode: "json" }).$type<CallDebrief>(),
    outcome: text("outcome", {
      enum: [
        "connected",
        "no_answer",
        "voicemail",
        "rescheduled",
        "follow_up",
        "closed_won",
        "closed_lost",
      ],
    }),
    nextStep: text("next_step"),
    suggestedStage: text("suggested_stage", { enum: ["S", "P", "A", "N", "C", "O"] }),
    analyzedAt: ts("analyzed_at"),
  },
  (t) => [
    index("calls_deal_idx").on(t.dealId),
    index("calls_client_idx").on(t.clientId),
    // Status + time columns are filtered/sorted on every Today queue render
    // and every KPI calculation.
    index("calls_status_idx").on(t.status),
    index("calls_started_at_idx").on(t.startedAt),
    index("calls_scheduled_at_idx").on(t.scheduledAt),
    index("calls_analyzed_at_idx").on(t.analyzedAt),
  ],
);

// ---------- call_turns ----------
export const callTurns = sqliteTable(
  "call_turns",
  {
    id: id(),
    callId: text("call_id")
      .notNull()
      .references(() => calls.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    who: text("who", { enum: ["rep", "client"] }).notNull(),
    speakerLabel: text("speaker_label"),
    text: text("text").notNull(),
    ts: ts("ts")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [index("call_turns_call_idx").on(t.callId)],
);

// ---------- call_tips (live AI coach output) ----------
export const callTips = sqliteTable(
  "call_tips",
  {
    id: id(),
    callId: text("call_id")
      .notNull()
      .references(() => calls.id, { onDelete: "cascade" }),
    turnIdx: integer("turn_idx"),
    kind: text("kind", { enum: ["TIP", "WARN", "NUDGE"] })
      .default("TIP")
      .notNull(),
    text: text("text").notNull(),
    createdAt: ts("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [index("call_tips_call_idx").on(t.callId)],
);

// ---------- health_checks ----------
export const healthChecks = sqliteTable(
  "health_checks",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    overallScore: integer("overall_score").notNull(),
    status: text("status", { enum: ["Healthy", "At risk", "Critical"] }).notNull(),
    peersScore: integer("peers_score"),
    summary: text("summary").notNull(),
    callouts: text("callouts", { mode: "json" })
      .$type<{ value: string; tone: "good" | "warn" | "bad" | "info" }[]>()
      .default([]),
    related: text("related", { mode: "json" }).$type<string[]>().default([]),
    meta: text("meta"),
    modelVersion: text("model_version"),
    generatedAt: ts("generated_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [
    index("health_checks_client_idx").on(t.clientId),
    // Used by getLatestHealthCheck and timeline.
    index("health_checks_generated_at_idx").on(t.generatedAt),
  ],
);

export const healthDimensions = sqliteTable("health_dimensions", {
  id: id(),
  healthCheckId: text("health_check_id")
    .notNull()
    .references(() => healthChecks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  score: integer("score").notNull(),
  status: text("status", { enum: ["Healthy", "At risk", "Critical"] }).notNull(),
  summary: text("summary").notNull(),
  metrics: text("metrics", { mode: "json" })
    .$type<{ label: string; value: string; trend: "up" | "down" | "flat" }[]>()
    .default([]),
  sortIdx: integer("sort_idx").default(0).notNull(),
});

export const healthRisks = sqliteTable("health_risks", {
  id: id(),
  healthCheckId: text("health_check_id")
    .notNull()
    .references(() => healthChecks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  tone: text("tone", { enum: ["good", "warn", "bad", "info"] })
    .default("warn")
    .notNull(),
  tag: text("tag").notNull(),
  sortIdx: integer("sort_idx").default(0).notNull(),
});

export const healthActions = sqliteTable("health_actions", {
  id: id(),
  healthCheckId: text("health_check_id")
    .notNull()
    .references(() => healthChecks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  impact: text("impact").notNull(),
  sortIdx: integer("sort_idx").default(0).notNull(),
});

// ---------- proposals (saved AI-generated workshop proposals) ----------
export const proposals = sqliteTable(
  "proposals",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    healthCheckId: text("health_check_id").references(() => healthChecks.id, {
      onDelete: "set null",
    }),
    output: text("output", { mode: "json" }).$type<ProposalOutput>().notNull(),
    cohortSize: integer("cohort_size").notNull(),
    perPaxCents: integer("per_pax_cents").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    sstCents: integer("sst_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    venue: text("venue", { enum: ["on_site", "remote", "hybrid"] }).notNull(),
    modelVersion: text("model_version").default("deepseek-chat").notNull(),
    generatedAt: ts("generated_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [
    index("proposals_client_idx").on(t.clientId),
    // Sorted desc on every "latest proposal" lookup (draft-email, today queue,
    // proposal-core's prior-proposal context).
    index("proposals_generated_at_idx").on(t.generatedAt),
  ],
);

// ---------- deal_insight_cache ----------
export const dealInsightCache = sqliteTable("deal_insight_cache", {
  dealId: text("deal_id")
    .primaryKey()
    .references(() => deals.id, { onDelete: "cascade" }),
  inputHash: text("input_hash").notNull(),
  text: text("text").notNull(),
  generatedAt: ts("generated_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

// ---------- coaching panel (closing-call grader output) ----------
// ownerRepId on coaching tables is nullable so the single-user system keeps
// working without a default rep mapping. When auth lands and reps share an
// install, queries gain a `where(eq(ownerRepId, currentRepId))` filter and
// inserts get the rep ID from the session.
export const coachingScores = sqliteTable("coaching_scores", {
  id: id(),
  ownerRepId: text("owner_rep_id").references(() => reps.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  score: integer("score").notNull(),
  sortIdx: integer("sort_idx").default(0).notNull(),
  generatedAt: ts("generated_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

export const coachingOpportunities = sqliteTable("coaching_opportunities", {
  id: id(),
  ownerRepId: text("owner_rep_id").references(() => reps.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  impactText: text("impact_text").notNull(),
  impactTone: text("impact_tone", { enum: ["good", "warn", "bad", "info"] })
    .default("warn")
    .notNull(),
  sortIdx: integer("sort_idx").default(0).notNull(),
  generatedAt: ts("generated_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

export const coachingWins = sqliteTable("coaching_wins", {
  id: id(),
  ownerRepId: text("owner_rep_id").references(() => reps.id, { onDelete: "cascade" }),
  prefix: text("prefix").notNull(),
  num: text("num"),
  suffix: text("suffix"),
  sortIdx: integer("sort_idx").default(0).notNull(),
  generatedAt: ts("generated_at")
    .$defaultFn(() => Date.now())
    .notNull(),
});

// ---------- relations ----------
export const clientsRelations = relations(clients, ({ many, one }) => ({
  deals: many(deals),
  calls: many(calls),
  healthChecks: many(healthChecks),
  proposals: many(proposals),
  owner: one(reps, { fields: [clients.ownerRepId], references: [reps.id] }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
  healthCheck: one(healthChecks, {
    fields: [proposals.healthCheckId],
    references: [healthChecks.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  client: one(clients, { fields: [deals.clientId], references: [clients.id] }),
  owner: one(reps, { fields: [deals.ownerRepId], references: [reps.id] }),
  calls: many(calls),
  insightCache: one(dealInsightCache, {
    fields: [deals.id],
    references: [dealInsightCache.dealId],
  }),
}));

export const callsRelations = relations(calls, ({ one, many }) => ({
  client: one(clients, { fields: [calls.clientId], references: [clients.id] }),
  deal: one(deals, { fields: [calls.dealId], references: [deals.id] }),
  rep: one(reps, { fields: [calls.repId], references: [reps.id] }),
  scriptTemplate: one(scriptTemplates, {
    fields: [calls.scriptTemplateId],
    references: [scriptTemplates.id],
  }),
  turns: many(callTurns),
  tips: many(callTips),
}));

export const callTurnsRelations = relations(callTurns, ({ one }) => ({
  call: one(calls, { fields: [callTurns.callId], references: [calls.id] }),
}));

export const callTipsRelations = relations(callTips, ({ one }) => ({
  call: one(calls, { fields: [callTips.callId], references: [calls.id] }),
}));

export const healthChecksRelations = relations(healthChecks, ({ one, many }) => ({
  client: one(clients, { fields: [healthChecks.clientId], references: [clients.id] }),
  dimensions: many(healthDimensions),
  risks: many(healthRisks),
  actions: many(healthActions),
}));

export const healthDimensionsRelations = relations(healthDimensions, ({ one }) => ({
  healthCheck: one(healthChecks, {
    fields: [healthDimensions.healthCheckId],
    references: [healthChecks.id],
  }),
}));

export const healthRisksRelations = relations(healthRisks, ({ one }) => ({
  healthCheck: one(healthChecks, {
    fields: [healthRisks.healthCheckId],
    references: [healthChecks.id],
  }),
}));

export const healthActionsRelations = relations(healthActions, ({ one }) => ({
  healthCheck: one(healthChecks, {
    fields: [healthActions.healthCheckId],
    references: [healthChecks.id],
  }),
}));

// ---------- invoice_counters (atomic per-year sequence) ----------
// One row per year with the last-issued seq. Atomic UPSERT via libSQL's
// INSERT … ON CONFLICT … DO UPDATE … RETURNING — eliminates the race
// where two concurrent invoice generations would be assigned the same number.
export const invoiceCounters = sqliteTable("invoice_counters", {
  year: integer("year").primaryKey(),
  lastSeq: integer("last_seq").notNull().default(0),
});

// ---------- task_dismissals (snooze for /today queue) ----------
export const taskDismissals = sqliteTable(
  "task_dismissals",
  {
    id: id(),
    ownerRepId: text("owner_rep_id").references(() => reps.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull(),
    snoozedUntil: ts("snoozed_until").notNull(),
    reason: text("reason"),
    createdAt: ts("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [index("task_dismissals_task_idx").on(t.taskId)],
);

// ---------- scratch_notes (quick-capture from /today) ----------
export const scratchNotes = sqliteTable(
  "scratch_notes",
  {
    id: id(),
    ownerRepId: text("owner_rep_id").references(() => reps.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    dueAt: ts("due_at"),
    doneAt: ts("done_at"),
    createdAt: ts("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
  },
  (t) => [index("scratch_notes_done_idx").on(t.doneAt)],
);

// helper unused-export to avoid tree-shaking complaints in older bundlers
export const _primaryKey = primaryKey;
