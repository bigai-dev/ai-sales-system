import type { TourStep } from "./types";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to SALES.AI",
    body:
      "60-second tour of how a Malaysian SME founder runs the full sales cycle here — from cold lead to paid SST invoice. Hit Next to start.",
    placement: "center",
    route: () => "/",
  },
  {
    id: "dashboard-kpis",
    title: "Your morning glance",
    body:
      "Pipeline value, conversion, hot deals — the four numbers you check first thing each day before deciding where to spend energy.",
    placement: "bottom",
    route: () => "/",
    anchor: '[data-tour="kpi-row"]',
  },
  {
    id: "today-queue",
    title: "What needs you today",
    body:
      "Auto-generated from stale proposals, deals stuck in stage, and your own quick-captures. Snooze what can wait — the queue rebuilds itself.",
    placement: "bottom",
    route: () => "/today",
    anchor: '[data-tour="today-list"]',
  },
  {
    id: "client-discovery",
    title: "Everything about one client",
    body:
      "Discovery captures what the client actually wants — goals, pain, budget, decision-makers. This is what powers every AI generation downstream.",
    placement: "top",
    route: (t) => (t.clientId ? `/clients/${t.clientId}` : "/clients"),
    anchor: '[data-tour="client-discovery"]',
  },
  {
    id: "client-timeline",
    title: "The full story, chronological",
    body:
      "Every call, proposal, and audit for this client merged into one timeline. When a prospect emails three weeks later asking 'what did we agree on?', this is the answer.",
    placement: "top",
    route: (t) => (t.clientId ? `/clients/${t.clientId}` : "/clients"),
    anchor: '[data-tour="client-timeline"]',
  },
  {
    id: "call-debrief",
    title: "AI debrief in 5 seconds",
    body:
      "Paste the transcript or rough notes. DeepSeek extracts outcome, objections, commitments, and the next move — then drafts a Gmail-ready follow-up email.",
    placement: "right",
    route: (t) => (t.callId ? `/calls/${t.callId}` : "/calls"),
    anchor: '[data-tour="debrief-panel"]',
  },
  {
    id: "proposal-and-invoice",
    title: "Proposal → close → SST invoice",
    body:
      "One click generates a tailored workshop proposal PDF. When the deal hits Closed-won, generate a Malaysian SST tax invoice — sequential numbering, 8% breakdown, bank details, ready to send.",
    placement: "top",
    route: (t) => (t.clientId ? `/clients/${t.clientId}` : "/clients"),
    anchor: '[data-tour="deals-panel"]',
  },
  {
    id: "wrap",
    title: "That's the loop",
    body:
      "Lead → discovery → call → debrief → proposal → close → invoice — without leaving the app. Click Demo mode anytime to replay.",
    placement: "center",
    route: () => "/",
  },
];
