import type { TourStep } from "./types";
import { routes } from "@/lib/constants/routes";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to SALES.AI",
    body:
      "A one-minute tour of how a Malaysian SME founder runs the whole sales cycle here, from new lead to paid SST invoice. Press Next to start.",
    placement: "center",
    route: () => routes.dashboard(),
  },
  {
    id: "dashboard-kpis",
    title: "Your morning glance",
    body:
      "Open deal value, workshops booked, calls made and average workshop value: the four numbers to check before deciding where to spend the day.",
    placement: "bottom",
    route: () => routes.dashboard(),
    anchor: '[data-tour="kpi-row"]',
  },
  {
    id: "today-queue",
    title: "What needs you today",
    body:
      "Built automatically from stale proposals, deals that stopped moving, and your own notes. Snooze what can wait; the list rebuilds itself.",
    placement: "bottom",
    route: () => routes.today(),
    anchor: '[data-tour="today-list"]',
  },
  {
    id: "client-discovery",
    title: "Everything about one client",
    body:
      "Discovery captures what the client actually wants: goals, pain points, budget, decision-makers. Everything the AI writes for this client starts here.",
    placement: "top",
    route: (t) => (t.clientId ? routes.client(t.clientId) : routes.clients()),
    anchor: '[data-tour="client-discovery"]',
  },
  {
    id: "client-timeline",
    title: "The full story, in order",
    body:
      "Every call, proposal and readiness check for this client in one timeline. When a client emails three weeks later asking 'what did we agree?', this is the answer.",
    placement: "top",
    route: (t) => (t.clientId ? routes.client(t.clientId) : routes.clients()),
    anchor: '[data-tour="client-timeline"]',
  },
  {
    id: "call-debrief",
    title: "Call review in seconds",
    body:
      "Paste your rough notes. The AI pulls out the outcome, objections, commitments and next step, then drafts a follow-up email ready to send.",
    placement: "right",
    route: (t) => (t.callId ? routes.call(t.callId) : routes.calls()),
    anchor: '[data-tour="debrief-panel"]',
  },
  {
    id: "proposal-and-invoice",
    title: "Proposal → Won → SST invoice",
    body:
      "One click writes a tailored workshop proposal PDF. When the deal is Won, download a Malaysian SST tax invoice: sequential numbering, 8% breakdown, bank details.",
    placement: "top",
    route: (t) => (t.clientId ? routes.client(t.clientId) : routes.clients()),
    anchor: '[data-tour="deals-panel"]',
  },
  {
    id: "wrap",
    title: "That's the loop",
    body:
      "Lead → discovery → call → review → proposal → won → invoice, without leaving the app. Open Demo → Guided tour any time to replay.",
    placement: "center",
    route: () => routes.dashboard(),
  },
];
