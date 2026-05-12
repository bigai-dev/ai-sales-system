// UI display-shape types. Consumed by view components and by the seed data
// in db/seed-data.ts.

import type { ReactNode } from "react";
import type { ClientSize, ClientStage, DecisionMaker } from "@/lib/types/client";
import type { ClientSource } from "@/lib/constants/labels";

export type Kpi = {
  label: string;
  value: string;
  delta?: { text: string; up?: boolean };
  chip?: { text: string; tone: "good" | "warn" | "bad" | "info" };
  bar?: number;
  caption: ReactNode;
};

export type Stage = {
  name: string;
  count: number;
  pct: number;
  color: string;
  value: string;
  weighted: string;
};

export type Rep = {
  initials: string;
  name: string;
  attainment: number;
  deals: number;
  pipe: string;
  calls: number;
  gradient: string;
};

export type Deal = {
  id?: string;
  clientId?: string;
  initials: string;
  company: string;
  contact: string;
  role: string;
  value: string;
  daysInStage: number;
  lastActivity: string;
  insight: string;
  tags: [string, string];
  next: string;
  hot?: boolean;
  headcount?: number;
};

export type KanbanColumn = {
  code: string;
  name: string;
  description: string;
  count: number;
  total: string;
  deals: Deal[];
};

export type Client = {
  id?: string;
  initials: string;
  name: string;
  contact: string;
  contactRole?: string;
  stage: ClientStage;
  industry: string;
  size: ClientSize;
  employees: number;
  devCount?: number;
  arr: string;
  health: number;
  products: string[];
  lastActivity: string;
  gradient: string;
  // ---- Discovery profile (optional; the founder fills these in over time) ----
  goals?: string;
  painPoints?: string;
  currentStack?: string[];
  decisionMakers?: DecisionMaker[];
  budgetSignal?: string;
  timelineSignal?: string;
  source?: ClientSource;
  notes?: string;
};

export type Dimension = {
  name: string;
  score: number;
  status: "Healthy" | "At risk" | "Critical";
  summary: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
};
