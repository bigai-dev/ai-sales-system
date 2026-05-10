import type { ReactNode } from "react";

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

// One rep — solo founder. Used by the seed to populate the reps table.
export const reps: Rep[] = [
  {
    initials: "DC",
    name: "Founder",
    attainment: 0,
    deals: 0,
    pipe: "RM 0",
    calls: 0,
    gradient: "from-amber-400 to-orange-500",
  },
];

// Static activity series — visual filler for the dashboard line chart.
// Replace with a real per-week aggregation once enough call history exists.
export const callSeries = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  callsMade: [12, 14, 18, 17, 22, 25, 28, 26],
  pickedUp: [6, 7, 9, 8, 11, 13, 15, 14],
  conversations: [3, 4, 5, 5, 7, 8, 10, 9],
};

// Coaching-panel fallback. Used only until the on-demand grader (triggered
// from the dashboard) has written real rows. Tuned for the four objection
// categories the founder hears most often: content, budget, venue, time.
export const scoreBreakdown = [
  { label: "Content scope clarity", score: 68 },
  { label: "Budget probe timing", score: 56 },
  { label: "Venue + delivery commit", score: 52 },
  { label: "Time-block negotiation", score: 61 },
  { label: "3-question discovery hit rate", score: 74 },
];

export const opportunities = [
  {
    title: "Content scope answered too generically",
    impact: { text: "high impact", tone: "bad" as const },
    detail:
      "Buyers ask what's covered; \"AI workflows / prompt engineering / agentic dev\" reads as filler. Tie each module to the answer they gave on AI-knowledge level.",
  },
  {
    title: "Budget probe asked too late in the call",
    impact: { text: "high impact", tone: "bad" as const },
    detail:
      "Leaving the budget question until the last 5 minutes means you scope a 30-pax cohort the buyer can't fund this quarter. Probe budget after headcount, before content.",
  },
  {
    title: "Venue + delivery date left vague in proposal",
    impact: { text: "medium", tone: "warn" as const },
    detail:
      "\"Sometime in Q3\" pushes the deal to next quarter. Quote on-site vs remote with two specific date options on the first proposal.",
  },
];

export const wins: [string, string, string][] = [
  ["3-question discovery completion", "84%", "of calls"],
  ["Headcount → cohort mapping accepted", "+22%", "close rate"],
  ["On-site quote anchored at proposal", "61%", "of wins"],
  ["Date locked within 7 days of proposal", "3.4d", "median"],
];

// ---------- Pipeline (kanban) ----------

export type Deal = {
  id?: string;
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

// Malaysian SME pipeline. Mix of KL/PJ/Penang/JB-based companies across
// fintech, healthtech, edtech, logistics, e-commerce, and IIoT verticals.
// Workshop priced at RM 3,500/pax + 8% SST; cohorts cap at ~35.
export const pipelineBoard: KanbanColumn[] = [
  {
    code: "S",
    name: "Suspect",
    description: "Identified target, not yet contacted",
    count: 3,
    total: "RM 123K",
    deals: [
      {
        initials: "KP",
        company: "Kopikat Technologies Sdn Bhd",
        contact: "Ahmad Faisal Rahman",
        role: "Co-founder/CTO",
        value: "RM 42K",
        headcount: 12,
        daysInStage: 2,
        lastActivity: "Founder LinkedIn post on Cursor · 2d ago",
        insight:
          "Ex-Maybank fintech team, F&B POS startup. Engineering team small but technically strong — open with the AI-knowledge probe early, they likely score high on it.",
        tags: ["Fintech / F&B", "Tooling-aware"],
        next: "This week",
      },
      {
        initials: "SL",
        company: "Selasih Logistics Sdn Bhd",
        contact: "Tan Wei Ming",
        role: "Head of Engineering",
        value: "RM 53K",
        headcount: 15,
        daysInStage: 5,
        lastActivity: "Hiring spree on JobStreet · 4d ago",
        insight:
          "Last-mile for Lazada/Shopee KL/PJ — scaling fast, integration-heavy work. Lead with PR-review patterns; their team velocity is the bottleneck.",
        tags: ["Logistics", "Marketplace integrator"],
        next: "Mon 9:00am",
      },
      {
        initials: "PT",
        company: "Petalwise Sdn Bhd",
        contact: "Aishah Mohd Yusof",
        role: "Co-founder/CEO",
        value: "RM 28K",
        headcount: 8,
        daysInStage: 1,
        lastActivity: "Co-founder posted re: AI in retail · today",
        insight:
          "Tiny team — full cohort in one workshop. Aishah is non-technical, so route content rationale through their CTO. Reply window is short.",
        tags: ["Retail / E-commerce", "Founder-led"],
        next: "Today 4pm",
      },
    ],
  },
  {
    code: "P",
    name: "Prospect",
    description: "Replied / showed interest, no meeting yet",
    count: 2,
    total: "RM 112K",
    deals: [
      {
        initials: "KH",
        company: "Klinika Health Sdn Bhd",
        contact: "Dr. Vinod Raju",
        role: "Co-founder/CTO",
        value: "RM 49K",
        headcount: 14,
        daysInStage: 6,
        lastActivity: "Replied to email · 2d ago",
        insight:
          "PDPA-sensitive. On the discovery call, lead with AI-knowledge — guardrails for healthtech change which Day-2 modules they need. Champion exists, blocker is Compliance.",
        tags: ["Healthtech", "PDPA-heavy"],
        next: "Fri 8:00am",
      },
      {
        initials: "TM",
        company: "TradieMy Sdn Bhd",
        contact: "Nurul Hidayah Zaki",
        role: "Director of Engineering",
        value: "RM 63K",
        headcount: 18,
        daysInStage: 9,
        lastActivity: "Watched intro video · 5d ago",
        insight:
          "Home services marketplace, MY+SG. Senior engineer bottleneck = the real pain. Probe budget early; they have L&D earmarked already per their LinkedIn job ad.",
        tags: ["Marketplace", "Bottleneck pain"],
        next: "Tue 11:00am",
      },
    ],
  },
  {
    code: "A",
    name: "Analysis",
    description: "Discovery call done — headcount + AI level + budget captured",
    count: 2,
    total: "RM 154K",
    deals: [
      {
        initials: "ME",
        company: "MyEduConnect Sdn Bhd",
        contact: "Chong Lee Hoon",
        role: "VP Engineering",
        value: "RM 84K",
        headcount: 24,
        daysInStage: 11,
        lastActivity: "Discovery call · yesterday",
        insight:
          "32 engineers across 5 squads. Mixed AI knowledge — quote a Day-1-heavy curriculum and lock the venue on the proposal, not after. CFO is the budget blocker.",
        tags: ["Edtech", "Cross-squad inconsistency"],
        next: "Wed 2:00pm",
      },
      {
        initials: "PC",
        company: "Padu Cipta Manufacturing Solutions Sdn Bhd",
        contact: "Ibrahim Hassan",
        role: "Head of Tech",
        value: "RM 70K",
        headcount: 20,
        daysInStage: 14,
        lastActivity: "Pre-shared workshop outline · 3d ago",
        insight:
          "Penang-based IIoT for SME manufacturers. Hardware-software bridge is the pitch. Pre-share the Cursor/Claude module before next call so it's a confirmed inclusion, not an objection.",
        tags: ["IIoT / Manufacturing", "Penang-based"],
        next: "Tue 10:00am",
      },
    ],
  },
  {
    code: "N",
    name: "Negotiation",
    description: "Proposal sent — content / venue / dates being aligned",
    count: 3,
    total: "RM 249K",
    deals: [
      {
        initials: "AM",
        company: "Agromart Networks Sdn Bhd",
        contact: "Priya Devi Krishnan",
        role: "Director of Engineering",
        value: "RM 91K",
        headcount: 26,
        daysInStage: 4,
        lastActivity: "Pricing call · today",
        insight:
          "B2B grocery supply chain. Champion is data-driven, founder is also a champion. Pre-write success metrics into the proposal so SST math + dates are the only open items.",
        tags: ["AgriTech / B2B", "Two champions"],
        next: "Tomorrow 9am",
        hot: true,
      },
      {
        initials: "RM",
        company: "Rentak Media Sdn Bhd",
        contact: "Siew Ling Wong",
        role: "Engineering Lead",
        value: "RM 53K",
        headcount: 15,
        daysInStage: 17,
        lastActivity: "Procurement form sent · 4d ago",
        insight:
          "Internal tools team inside an agency. Cohort = engineers only (15), not creatives. Frame Day-2 around content-pipeline tooling; don't mix personas.",
        tags: ["Media / Agency", "Engineers-only cohort"],
        next: "Mon 10:00am",
      },
      {
        initials: "GB",
        company: "GoBeli Group Sdn Bhd",
        contact: "Mei Lin Yap",
        role: "CTO",
        value: "RM 105K",
        headcount: 30,
        daysInStage: 21,
        lastActivity: "Cradle co-investor follow-up · 2d ago",
        insight:
          "45 engineers needs phased plan, not one workshop. Propose this cohort as phase 1 of 2, sketch phase 2 for Oct with venue + date. Cradle-backed, ambitious CTO.",
        tags: ["E-commerce", "Phased rollout"],
        next: "Thu 9:00am",
        hot: true,
      },
    ],
  },
  {
    code: "C",
    name: "Conclusion",
    description: "Verbal yes — awaiting payment to lock the date",
    count: 2,
    total: "RM 182K",
    deals: [
      {
        initials: "PS",
        company: "PropSimplify Sdn Bhd",
        contact: "Suresh Kumar Pillai",
        role: "COO",
        value: "RM 77K",
        headcount: 22,
        daysInStage: 3,
        lastActivity: "COO confirmed verbal · today",
        insight:
          "Verbal yes captured. CEO is cost-sensitive — invoice today, push for payment Friday. Use PropertyGuru AI features in the pitch as competitive pressure.",
        tags: ["Property / Marketplace", "Cost-sensitive CEO"],
        next: "Fri 9:00am",
        hot: true,
      },
      {
        initials: "WI",
        company: "Wira Insurance Tech Sdn Bhd",
        contact: "Hassan Iskandar",
        role: "CIO",
        value: "RM 105K",
        headcount: 30,
        daysInStage: 8,
        lastActivity: "Etiqa partnership signed · 5d ago",
        insight:
          "Last buy-in is the CISO (separate from CIO). Pre-walk curriculum with security so they sponsor the venue, not gate it. Confirm on-site vs remote on same call.",
        tags: ["InsurTech", "Etiqa partner"],
        next: "Tue 3:00pm",
      },
    ],
  },
  {
    code: "O",
    name: "Order",
    description: "Invoice paid · workshop date locked",
    count: 2,
    total: "RM 119K",
    deals: [
      {
        initials: "BX",
        company: "Bumimax Industrial Bhd",
        contact: "Anitha Pillai",
        role: "Head of Digital",
        value: "RM 63K",
        headcount: 18,
        daysInStage: 1,
        lastActivity: "Invoice paid · today",
        insight:
          "Date locked. Listed manufacturer in digital transformation. Send the readiness baseline survey 14 days before kickoff so cohort prework reflects their actual AI-knowledge level.",
        tags: ["Manufacturing", "Listed company"],
        next: "Today 4pm",
      },
      {
        initials: "HL",
        company: "Halal Logistics Berhad",
        contact: "Mohd Hafiz Ramli",
        role: "COO",
        value: "RM 56K",
        headcount: 16,
        daysInStage: 12,
        lastActivity: "Workshop delivered · last month",
        insight:
          "Delivered. Survey the win, then propose follow-on lead-engineer 1:1s with the 3 strongest promoters. Sets up the next phase quote.",
        tags: ["Logistics / Halal", "Expansion-ready"],
        next: "Next week",
      },
    ],
  },
];

// ---------- Clients ----------

export type Client = {
  id?: string;
  initials: string;
  name: string;
  contact: string;
  contactRole?: string;
  stage: "Lead" | "Qualified" | "Discovery" | "Proposal" | "Negotiation" | "Closed-won";
  industry: string;
  size: "SMB" | "Mid-market" | "Enterprise";
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
  decisionMakers?: { name: string; role: string; stance: "champion" | "neutral" | "blocker" }[];
  budgetSignal?: string;
  timelineSignal?: string;
  source?: "referral" | "cold_inbound" | "event" | "linkedin" | "warm_intro" | "other";
  notes?: string;
};

export const clientList: Client[] = [
  // ---- Suspect / Lead tier (3) ----
  {
    initials: "KP",
    name: "Kopikat Technologies Sdn Bhd",
    contact: "Ahmad Faisal Rahman",
    contactRole: "Co-founder/CTO",
    stage: "Lead",
    industry: "Fintech / F&B",
    size: "SMB",
    employees: 28,
    devCount: 12,
    arr: "RM 42K",
    health: 64,
    products: [],
    lastActivity: "2d ago",
    gradient: "from-orange-400 to-rose-500",
    source: "warm_intro",
    notes:
      "Intro from Maybank fintech network. F&B POS + payments for SME cafes. Founder team is technically strong (ex-Maybank).",
  },
  {
    initials: "SL",
    name: "Selasih Logistics Sdn Bhd",
    contact: "Tan Wei Ming",
    contactRole: "Head of Engineering",
    stage: "Lead",
    industry: "Logistics",
    size: "SMB",
    employees: 50,
    devCount: 15,
    arr: "RM 53K",
    health: 58,
    products: [],
    lastActivity: "4d ago",
    gradient: "from-teal-400 to-emerald-500",
    source: "linkedin",
  },
  {
    initials: "PT",
    name: "Petalwise Sdn Bhd",
    contact: "Aishah Mohd Yusof",
    contactRole: "Co-founder/CEO",
    stage: "Lead",
    industry: "Retail / E-commerce",
    size: "SMB",
    employees: 22,
    devCount: 8,
    arr: "RM 28K",
    health: 52,
    products: [],
    lastActivity: "today",
    gradient: "from-amber-400 to-orange-500",
    source: "cold_inbound",
  },

  // ---- Prospect / Qualified tier (2) ----
  {
    initials: "KH",
    name: "Klinika Health Sdn Bhd",
    contact: "Dr. Vinod Raju",
    contactRole: "Co-founder/CTO",
    stage: "Qualified",
    industry: "Healthtech",
    size: "SMB",
    employees: 35,
    devCount: 14,
    arr: "RM 49K",
    health: 60,
    products: [],
    lastActivity: "2d ago",
    gradient: "from-amber-400 to-orange-500",
    goals:
      "Train clinic engineers to add AI features (symptom triage, prescription suggestions) without DSP/PDPA pitfalls.",
    painPoints:
      "Two engineers tried Cursor on their own — generated Python code that violated their typing conventions. Spent more time fixing AI output than writing it.",
    currentStack: ["TypeScript", "NestJS", "Next.js", "PostgreSQL", "Cursor (3 seats)"],
    decisionMakers: [
      { name: "Dr. Vinod Raju", role: "Co-founder/CTO", stance: "champion" },
      { name: "Sarah Chong", role: "Head of Compliance", stance: "blocker" },
    ],
    budgetSignal: "RM 40-50K range; can stretch to 60K with board approval",
    timelineSignal: "Want to run before MOH audit cycle starts in August",
    source: "warm_intro",
    notes:
      "Friend introduced them. They lost a deal to a Singapore competitor last quarter that 'shipped faster'. AI is their reaction.",
  },
  {
    initials: "TM",
    name: "TradieMy Sdn Bhd",
    contact: "Nurul Hidayah Zaki",
    contactRole: "Director of Engineering",
    stage: "Qualified",
    industry: "Marketplace",
    size: "SMB",
    employees: 42,
    devCount: 18,
    arr: "RM 63K",
    health: 66,
    products: [],
    lastActivity: "5d ago",
    gradient: "from-stone-400 to-amber-500",
    goals: "Cut PR review time from 2 days to same-day across the engineering team.",
    painPoints:
      "Senior engineers have become the bottleneck. Junior code via Cursor lacks consistency, so PRs sit waiting for senior review.",
    currentStack: ["Go", "React Native", "AWS Lambda", "DynamoDB"],
    decisionMakers: [
      { name: "Nurul Hidayah Zaki", role: "Director of Eng", stance: "champion" },
      { name: "Khairul Anuar", role: "CEO", stance: "neutral" },
    ],
    source: "cold_inbound",
  },

  // ---- Analysis / Discovery tier (2) ----
  {
    initials: "ME",
    name: "MyEduConnect Sdn Bhd",
    contact: "Chong Lee Hoon",
    contactRole: "VP Engineering",
    stage: "Discovery",
    industry: "Edtech",
    size: "SMB",
    employees: 78,
    devCount: 32,
    arr: "RM 84K",
    health: 68,
    products: [],
    lastActivity: "yesterday",
    gradient: "from-emerald-500 to-teal-400",
    goals:
      "Standardize how engineers use AI across 5 product squads. Currently each squad has its own habits.",
    painPoints:
      "Code review takes 1.5 days median because reviewers don't trust AI-generated PRs from other squads.",
    currentStack: ["Java/Spring", "Vue.js", "PostgreSQL", "GitHub Copilot (rolling out)"],
    decisionMakers: [
      { name: "Chong Lee Hoon", role: "VP Engineering", stance: "champion" },
      { name: "Faisal Rahman", role: "Head of Platform", stance: "neutral" },
      { name: "Mei Yan Tan", role: "CFO", stance: "blocker" },
    ],
    budgetSignal: "RM 80-100K approved for L&D this year, of which RM 30K already spent",
    timelineSignal: "Need to run before Aug-Sep school exam season prep",
    source: "event",
    notes:
      "Met at MDEC AI Summit. Worried about being undercut by Singapore competitors who 'ship 2x faster with AI'.",
  },
  {
    initials: "PC",
    name: "Padu Cipta Manufacturing Solutions Sdn Bhd",
    contact: "Ibrahim Hassan",
    contactRole: "Head of Tech",
    stage: "Discovery",
    industry: "IIoT / Manufacturing",
    size: "SMB",
    employees: 65,
    devCount: 22,
    arr: "RM 70K",
    health: 60,
    products: [],
    lastActivity: "3d ago",
    gradient: "from-orange-400 to-rose-500",
    goals:
      "Get the Penang team productive on agentic IIoT prototypes — they currently take 3 weeks per POC.",
    painPoints:
      "Hardware engineers struggling with software-side AI tooling. Need a bridge from C++/Python embedded work to LLM-assisted prototyping.",
    currentStack: ["C++", "Python", "Node-RED", "MQTT", "Cursor (1 seat)"],
    decisionMakers: [
      { name: "Ibrahim Hassan", role: "Head of Tech", stance: "champion" },
      { name: "Tan Beng Hock", role: "MD", stance: "neutral" },
    ],
    timelineSignal: "Tied to Q3 customer pilot deadline",
    source: "linkedin",
  },

  // ---- Negotiation tier (3) ----
  {
    initials: "AM",
    name: "Agromart Networks Sdn Bhd",
    contact: "Priya Devi Krishnan",
    contactRole: "Director of Engineering",
    stage: "Negotiation",
    industry: "AgriTech / B2B",
    size: "SMB",
    employees: 95,
    devCount: 28,
    arr: "RM 91K",
    health: 74,
    products: [],
    lastActivity: "today",
    gradient: "from-emerald-500 to-teal-400",
    goals:
      "Train the engineering team to build AI features for our supplier-side mobile app (auto-quote, demand forecasting).",
    painPoints:
      "Engineers don't trust LLM output for financial calculations; falling back to manual Excel for quote generation.",
    currentStack: ["TypeScript", "Next.js", "PostgreSQL", "AWS"],
    decisionMakers: [
      { name: "Priya Devi Krishnan", role: "Director of Eng", stance: "champion" },
      { name: "Vincent Ong", role: "Founder/CEO", stance: "champion" },
    ],
    budgetSignal: "RM 80-100K",
    timelineSignal: "Want delivery by mid-July",
    source: "referral",
    notes:
      "Strong founder enthusiasm. Already using DeepSeek in production for product descriptions. Two champions = unusually clean deal.",
  },
  {
    initials: "RM",
    name: "Rentak Media Sdn Bhd",
    contact: "Siew Ling Wong",
    contactRole: "Engineering Lead",
    stage: "Negotiation",
    industry: "Media / Agency",
    size: "SMB",
    employees: 60,
    devCount: 18,
    arr: "RM 53K",
    health: 62,
    products: [],
    lastActivity: "4d ago",
    gradient: "from-rose-500 to-amber-500",
    goals:
      "Get the internal tools team building AI features for the content production pipeline.",
    painPoints:
      "Tools team is 15 engineers serving 45 creatives. Bottleneck on tooling means creative team workflows lag.",
    currentStack: ["Python", "FastAPI", "React", "PostgreSQL"],
    decisionMakers: [{ name: "Siew Ling Wong", role: "Engineering Lead", stance: "champion" }],
    source: "linkedin",
    notes: "Cohort = engineers only (15), not creatives. Don't mix personas in pitch.",
  },
  {
    initials: "GB",
    name: "GoBeli Group Sdn Bhd",
    contact: "Mei Lin Yap",
    contactRole: "CTO",
    stage: "Negotiation",
    industry: "E-commerce",
    size: "Mid-market",
    employees: 110,
    devCount: 45,
    arr: "RM 105K",
    health: 78,
    products: [],
    lastActivity: "2d ago",
    gradient: "from-orange-400 to-rose-500",
    goals: "Roll out AI-assisted code review across 5 squads (45 engineers total) in two cohorts.",
    painPoints:
      "Junior engineers bottlenecking PR review queues, especially in checkout/payments squad.",
    currentStack: ["Ruby on Rails", "React", "PostgreSQL", "Cursor (15 seats)", "Claude Code"],
    decisionMakers: [
      { name: "Mei Lin Yap", role: "CTO", stance: "champion" },
      { name: "Hairul Anuar", role: "COO", stance: "neutral" },
      { name: "Lim Jun Hao", role: "Engineering Manager", stance: "champion" },
    ],
    budgetSignal: "RM 200K total budget across 2 cohorts; this proposal targets cohort 1",
    timelineSignal: "Cohort 1 in June, cohort 2 in October",
    source: "warm_intro",
    notes:
      "Cradle-backed, ambitious. CTO is technically strong and reads major AI eng blogs — speak at her level.",
  },

  // ---- Conclusion tier (2) ----
  {
    initials: "PS",
    name: "PropSimplify Sdn Bhd",
    contact: "Suresh Kumar Pillai",
    contactRole: "COO",
    stage: "Negotiation",
    industry: "Property / Marketplace",
    size: "SMB",
    employees: 80,
    devCount: 22,
    arr: "RM 77K",
    health: 70,
    products: [],
    lastActivity: "today",
    gradient: "from-emerald-500 to-teal-400",
    goals:
      "Train 22 engineers to standardize on Cursor + Claude Code workflows; their AI usage is fragmented.",
    painPoints:
      "Three different AI tools used in three squads with no shared rules. Output quality varies wildly across squads.",
    currentStack: ["Java", "Kotlin", "Vue.js", "PostgreSQL"],
    decisionMakers: [
      { name: "Suresh Kumar Pillai", role: "COO", stance: "champion" },
      { name: "Lai Chee Hoon", role: "CEO", stance: "neutral" },
    ],
    budgetSignal: "RM 70-80K budget approved",
    timelineSignal: "Want delivery in early June, before mid-year planning",
    source: "event",
    notes:
      "Met at PropertyGuru competitive briefing. They feel pressure from PropertyGuru's AI features.",
  },
  {
    initials: "WI",
    name: "Wira Insurance Tech Sdn Bhd",
    contact: "Hassan Iskandar",
    contactRole: "CIO",
    stage: "Negotiation",
    industry: "InsurTech",
    size: "Mid-market",
    employees: 140,
    devCount: 35,
    arr: "RM 105K",
    health: 72,
    products: [],
    lastActivity: "5d ago",
    gradient: "from-stone-400 to-amber-500",
    source: "referral",
    notes:
      "Etiqa partnership recently signed. CISO is the silent gate — pre-walk curriculum with security to convert him to sponsor not blocker.",
  },

  // ---- Order tier (2) ----
  {
    initials: "BX",
    name: "Bumimax Industrial Bhd",
    contact: "Anitha Pillai",
    contactRole: "Head of Digital",
    stage: "Closed-won",
    industry: "Manufacturing",
    size: "Mid-market",
    employees: 180,
    devCount: 18,
    arr: "RM 63K",
    health: 80,
    products: [],
    lastActivity: "today",
    gradient: "from-orange-400 to-rose-500",
    source: "event",
  },
  {
    initials: "HL",
    name: "Halal Logistics Berhad",
    contact: "Mohd Hafiz Ramli",
    contactRole: "COO",
    stage: "Closed-won",
    industry: "Logistics / Halal",
    size: "Mid-market",
    employees: 220,
    devCount: 16,
    arr: "RM 56K",
    health: 84,
    products: [],
    lastActivity: "last month",
    gradient: "from-teal-400 to-emerald-500",
    source: "warm_intro",
  },
];

// ---------- Health Check (legacy seed; unused once an audit has been generated) ----------

export type Dimension = {
  name: string;
  score: number;
  status: "Healthy" | "At risk" | "Critical";
  summary: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
};

export const healthCheck = {
  client: "MyEduConnect Sdn Bhd",
  meta: "Chong Lee Hoon · VP Engineering · Edtech SaaS · 78 employees · 32 engineers across 5 squads",
  related: ["Padu Cipta Manufacturing Solutions Sdn Bhd", "Agromart Networks Sdn Bhd", "GoBeli Group Sdn Bhd"],
  overall: { score: 62, status: "At risk", peers: 71, delta: "▼ 9 pts vs peers" },
  summary:
    "Engineering throughput holds up but AI tooling adoption is fragmented across the 5 squads. Roughly a third of engineers use AI tools weekly; the rest haven't adopted. Highest leverage is a 2-day workshop standardizing prompt hygiene + PR-review patterns, then 90 days of light measurement before Aug-Sep exam season prep.",
  callouts: [
    { value: "2 critical issues", tone: "bad" },
    { value: "3 high-risk areas", tone: "warn" },
    { value: "≈25% throughput upside", tone: "good" },
  ],
  dimensions: [
    {
      name: "Tooling",
      score: 60,
      status: "At risk",
      summary: "GitHub Copilot rolling out across squads; utilization uneven. No shared MCP servers or rule files.",
      metrics: [
        { label: "Daily AI tool usage", value: "42%", trend: "up" },
        { label: "Shared rule files", value: "0", trend: "flat" },
        { label: "MCP servers in use", value: "1", trend: "flat" },
      ],
    },
    {
      name: "Practices",
      score: 54,
      status: "At risk",
      summary: "PR review is human-only. No prompt-hygiene guidance, no shared agent guardrails across squads.",
      metrics: [
        { label: "AI-assisted PR reviews", value: "14%", trend: "up" },
        { label: "Prompt library", value: "ad-hoc", trend: "flat" },
      ],
    },
    {
      name: "Culture",
      score: 64,
      status: "At risk",
      summary: "VPE Chong Lee Hoon is the champion. CFO is a budget blocker. Two senior engineers vocal about AI risk; no clear blast-radius policy.",
      metrics: [
        { label: "Leadership posture", value: "split", trend: "flat" },
        { label: "Blast-radius policy", value: "none", trend: "flat" },
      ],
    },
    {
      name: "Velocity",
      score: 70,
      status: "Healthy",
      summary: "PRs/dev/wk healthy. Cycle time within target. Room to grow with tighter AI loops.",
      metrics: [
        { label: "PRs / dev / wk", value: "3.2", trend: "up" },
        { label: "Median cycle time", value: "1.8d", trend: "flat" },
      ],
    },
    {
      name: "Adoption",
      score: 50,
      status: "Critical",
      summary: "Only ~33% of engineers use AI tools daily. Web squad ahead of mobile, infra, data, and platform.",
      metrics: [
        { label: "Daily-active engineers", value: "33%", trend: "up" },
        { label: "License utilization", value: "42%", trend: "up" },
      ],
    },
    {
      name: "Outcomes",
      score: 68,
      status: "Healthy",
      summary: "Defect rate stable, time-to-feature trending down. AI contribution still hard to attribute.",
      metrics: [
        { label: "Escaped defects / mo", value: "3.8", trend: "down" },
        { label: "Time-to-feature", value: "10d", trend: "down" },
      ],
    },
  ] as Dimension[],
  risks: [
    {
      title: "Adoption gap between squads will compound",
      detail:
        "33% daily-active hides a wide spread. Without a workshop and shared baseline, the gap widens — hurting code review consistency across squads.",
      tone: "bad" as const,
      tag: "CRITICAL",
    },
    {
      title: "No prompt-hygiene or guardrail policy",
      detail:
        "Inconsistent prompts surface as inconsistent output quality. Two-day workshop fixes this directly.",
      tone: "bad" as const,
      tag: "CRITICAL",
    },
    {
      title: "Copilot license utilization at 42%",
      detail:
        "More than half of paid seats unused. Either reclaim seats or train the holders — both unlock budget headroom that the CFO will respond to.",
      tone: "warn" as const,
      tag: "HIGH RISK",
    },
  ],
  actions: [
    {
      title: "2-day vibe-coding workshop (24-pax cohort)",
      detail: "Standardize prompt hygiene, PR review patterns, and shared rule files in one block before Aug exam-prep season.",
      impact: "≈25% throughput upside",
    },
    {
      title: "Lead-engineer 1:1 series",
      detail: "Three 1-hour sessions with squad leads to lock new patterns in code review.",
      impact: "Adoption ↑ across squads",
    },
    {
      title: "30-day readiness baseline survey",
      detail: "Snapshot per-engineer comfort + tool usage. Re-measure 90 days post-workshop.",
      impact: "Measurable ROI for CFO",
    },
  ],
};
