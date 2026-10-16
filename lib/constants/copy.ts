// Shared sentences and names: navigation, page titles, button words, errors.
// Plain English, sentence case, no internal terms.

import { routes } from "./routes";

export type NavIcon =
  | "today"
  | "dashboard"
  | "clients"
  | "deals"
  | "calls"
  | "training"
  | "rolePlay"
  | "playbook";

export type NavItem = { label: string; href: string; icon: NavIcon };

export const NAV_MAIN: NavItem[] = [
  { label: "Today", href: routes.today(), icon: "today" },
  { label: "Dashboard", href: routes.dashboard(), icon: "dashboard" },
  { label: "Clients", href: routes.clients(), icon: "clients" },
  { label: "Deals", href: routes.deals(), icon: "deals" },
  { label: "Calls", href: routes.calls(), icon: "calls" },
];

export const NAV_TRAINING: NavItem[] = [
  { label: "Training", href: routes.training(), icon: "training" },
  { label: "Role play", href: routes.rolePlay(), icon: "rolePlay" },
  { label: "Playbook", href: routes.playbook(), icon: "playbook" },
];

export const BRAND = {
  name: "SALES.AI",
  tagline: "Sales for vibe-coding workshops",
};

export const PAGE = {
  today: { title: "Today", description: "What needs you now." },
  dashboard: { title: "Dashboard", description: "How the quarter is going." },
  clients: { title: "Clients", description: "Everyone you are selling to." },
  readinessIndex: {
    title: "Readiness checks",
    description: "How ready each client's team is for AI-assisted coding.",
  },
  readiness: { title: "Readiness check", description: "" },
  deals: { title: "Deals", description: "Drag a deal to change its stage." },
  calls: { title: "Calls", description: "Planned calls and completed reviews." },
  training: {
    title: "Training",
    description: "Trends from your real calls, plus two-minute role plays.",
  },
  rolePlay: {
    title: "Role play",
    description: "Pick a topic, answer a tough customer line, get a score.",
  },
  playbook: {
    title: "Playbook",
    description: "Lines that worked, pulled from your real calls.",
  },
} as const;

export const BTN = {
  add: "Add",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  close: "Close",
  tryAgain: "Try again",
  copy: "Copy as text",
  downloadPdf: "Download PDF",
  planCall: "Plan call",
  runReadiness: "Run readiness check",
  runAgain: "Run again",
  refresh: "Refresh",
  startRolePlay: "Start role play",
  rolePlayThisCall: "Role-play this call",
  reviewCall: "Review call",
  draftEmail: "Draft email",
  generateProposal: "Generate proposal",
} as const;

export const BUSY = {
  saving: "Saving…",
  adding: "Adding…",
  deleting: "Deleting…",
  running: "Running…",
  thinking: "Thinking…",
  loading: "Loading…",
} as const;

export const ERR = {
  /** "Couldn't plan this call. Try again." */
  ai: (verb: string) => `Couldn't ${verb}. Try again.`,
  generic: "Something went wrong. Try again.",
  dealMoved: "This deal was moved elsewhere. Refresh and try again.",
  notFound: "This record no longer exists.",
  needCallPlan: "Make a call plan first.",
  needReadiness: "Run a readiness check first.",
} as const;
