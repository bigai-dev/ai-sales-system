// Movie Mode — the webinar demo script.
//
// One hero company (Bumimax Industrial Bhd) carried through one deal, start to
// finish. Every AI payload below is pre-baked so it reveals instantly on stage
// and never depends on a live API call (no spinners, no wifi risk). The shapes
// mirror the real AI schemas (call-briefing, call-debrief, proposal, etc.) so
// the content looks exactly like what the app actually generates.
//
// To re-script the demo, edit this file only. Nothing here touches the DB.

export type SceneKind =
  | "title"
  | "client"
  | "briefing"
  | "call"
  | "debrief"
  | "proposal"
  | "transfer"
  | "close";

type BaseScene = {
  id: string;
  kind: SceneKind;
  eyebrow: string;
  // Reveal scenes show a setup + an AI button first, then the magic.
  reveal?: {
    headline: string;
    sub: string;
    button: string;
  };
};

export type TitleScene = BaseScene & {
  kind: "title";
  title: string;
  sub: string;
};

export type ClientScene = BaseScene & {
  kind: "client";
  company: string;
  meta: string;
  contacts: { name: string; role: string; tag?: string }[];
  facts: { label: string; value: string }[];
  caption: string;
};

export type BriefingScene = BaseScene & {
  kind: "briefing";
  context: string;
  questions: { question: string; why: string }[];
  objections: { tag: string; objection: string; response: string }[];
  goal: string;
  watchout: string;
  caption: string;
};

export type CallScene = BaseScene & {
  kind: "call";
  turns: { who: "client" | "rep" | "ai"; name: string; text: string }[];
  caption: string;
};

export type DebriefScene = BaseScene & {
  kind: "debrief";
  outcome: string;
  summary: string;
  objection: string;
  commitments: string[];
  nextStep: string;
  coaching: string;
  email: { subject: string; body: string; attachment: string };
  caption: string;
};

export type ProposalScene = BaseScene & {
  kind: "proposal";
  cohort: string;
  day1: { theme: string; modules: { title: string; why: string }[] };
  day2: { theme: string; modules: { title: string; why: string }[] };
  dates: string[];
  venue: string;
  pricing: string;
  caption: string;
};

export type TransferScene = BaseScene & {
  kind: "transfer";
  techniques: { tag: string; line: string; from: string }[];
  drill: { prompt: string; rubric: string[] };
  caption: string;
};

export type CloseScene = BaseScene & {
  kind: "close";
  title: string;
  sub: string;
  punch: string;
  cta: string;
};

export type Scene =
  | TitleScene
  | ClientScene
  | BriefingScene
  | CallScene
  | DebriefScene
  | ProposalScene
  | TransferScene
  | CloseScene;

export const SCENES: Scene[] = [
  {
    id: "title",
    kind: "title",
    eyebrow: "SALES.AI",
    title: "I built my entire sales system with AI.",
    sub: "Shaped to exactly how I sell. Watch me run one real deal — start to finish.",
  },
  {
    id: "client",
    kind: "client",
    eyebrow: "The prospect",
    company: "Bumimax Industrial Bhd",
    meta: "Manufacturing · Listed company · 180 staff · 18 engineers",
    contacts: [
      { name: "Anitha Pillai", role: "Head of Digital", tag: "Champion" },
      { name: "Tan Wei Loon", role: "CTO", tag: "Neutral" },
    ],
    facts: [
      {
        label: "What they want",
        value:
          "Get 18 engineers fluent in AI-assisted code review before their Q3 ERP migration.",
      },
      {
        label: "The pain",
        value:
          "Code reviews take 4–7 days. Senior engineers burn ~40% of their week reviewing instead of building.",
      },
      { label: "Budget", value: "RM 65K board-approved upskilling budget." },
      { label: "Deal value", value: "RM 63K" },
    ],
    caption: "Every detail captured automatically — nothing lives in my head.",
  },
  {
    id: "briefing",
    kind: "briefing",
    eyebrow: "Before the call",
    reveal: {
      headline: "It's 4pm. I'm about to call Anitha.",
      sub: "Normally I'd wing it. Instead —",
      button: "Prep this call with AI",
    },
    context:
      "Bumimax is in Negotiation — budget approved, dates tentatively locked. Today's call confirms the cohort split and the timing around their ERP migration.",
    questions: [
      {
        question:
          "Can all 18 attend together, or do you need to keep a crew on the ERP migration?",
        why: "Their migration is the real constraint — splitting the cohort may be necessary.",
      },
      {
        question: "Is the RM 65K board budget released, or still pending a PO?",
        why: "Confirms there's no approval delay before you commit dates.",
      },
      {
        question: "Should Tan Wei Loon sign off on the Day-2 agentic modules?",
        why: "He's neutral — pulling him in early de-risks the close.",
      },
    ],
    objections: [
      {
        tag: "Time",
        objection: "Two straight days will eat into our ERP migration prep.",
        response:
          "Offer two batches of nine on separate weeks — the migration stays staffed while everyone still gets trained.",
      },
      {
        tag: "Budget",
        objection: "RM 3,500 a head adds up across 18 people.",
        response:
          "It's RM 63,000 + 8% SST — already inside their board-approved RM 65K. Frame it against the 40% of senior-engineer time lost to reviews.",
      },
    ],
    goal: "Get Anitha to verbally confirm the cohort split and lock the two workshop dates.",
    watchout: "CTO isn't on the call — get his sign-off async before issuing the invoice.",
    caption: "One click, and the AI coaches me before I dial.",
  },
  {
    id: "call",
    kind: "call",
    eyebrow: "The call",
    turns: [
      {
        who: "client",
        name: "Anitha",
        text: "We're keen — but I can't pull all 18 off the ERP migration for two straight days.",
      },
      {
        who: "ai",
        name: "AI coach · live",
        text: "That's the time objection from your brief. Offer the two-batch split.",
      },
      {
        who: "rep",
        name: "You",
        text: "Totally fair. Let's run two batches of nine on separate weeks — your migration stays staffed, everyone still gets trained.",
      },
      { who: "client", name: "Anitha", text: "That works. Let's lock it." },
      {
        who: "rep",
        name: "You",
        text: "Great — so to confirm: two batches of nine, weeks of the 9th and 16th, invoice to follow today. Yes?",
      },
      { who: "client", name: "Anitha", text: "Yes, confirmed." },
    ],
    caption: "Every word captured — and the AI is coaching me live.",
  },
  {
    id: "debrief",
    kind: "debrief",
    eyebrow: "After the call",
    reveal: {
      headline: "Call's over.",
      sub: "Instead of typing notes for 20 minutes —",
      button: "Write up the call",
    },
    outcome: "Closed-won",
    summary:
      "Anitha confirmed the workshop: 18 engineers across two batches of nine (weeks of 9 & 16 June). Invoice to follow today; pre-work survey + Copilot kit-list two weeks before kickoff.",
    objection:
      "Time — couldn't pull all 18 off the ERP migration for two consecutive days.",
    commitments: [
      "You: send the SST tax invoice + dates today.",
      "You: share pre-work survey + Copilot kit-list 2 weeks before kickoff.",
      "Anitha: confirm the HQ room booking by Wednesday.",
    ],
    nextStep:
      "Send the SST tax invoice today; confirmation pack (venue + agenda) by tomorrow EOD.",
    coaching:
      "Strong recap discipline — you summarized the commitments out loud before hanging up. That's why she'll act fast. Keep doing it.",
    email: {
      subject: "Bumimax × AI code-review workshop — confirmed dates & next steps",
      body: "Hi Anitha,\n\nThanks for the call just now — great to lock this in. As agreed, we'll run two batches of nine engineers, the weeks of 9 and 16 June, so your ERP migration stays staffed throughout.\n\nFrom me today: the SST tax invoice (RM 63,000 + 8% SST = RM 68,040), plus the confirmation pack with venue and agenda by tomorrow EOD. Two weeks before kickoff I'll send the pre-work survey and the Copilot kit-list for your team.\n\nCould you confirm the HQ room booking by Wednesday so we can finalise logistics?\n\nLooking forward to it,\nDinesh",
      attachment: "Workshop proposal — 18 pax · RM 68,040 incl. SST",
    },
    caption: "I typed nothing. The AI wrote the summary and the follow-up email.",
  },
  {
    id: "proposal",
    kind: "proposal",
    eyebrow: "The proposal",
    reveal: {
      headline: "When a prospect is earlier in the pipeline,",
      sub: "the same system writes the entire proposal —",
      button: "Generate the proposal",
    },
    cohort:
      "18 engineers, mostly Copilot-aware but no structured review habit. Two batches of nine keeps the migration staffed and each room small enough for hands-on drills.",
    day1: {
      theme: "Day 1 — AI-assisted code review: the baseline",
      modules: [
        {
          title: "Prompt fluency for code review",
          why: "14 of 18 use Copilot, but never for structured review — sets a shared baseline.",
        },
        {
          title: "Reading a diff with AI",
          why: "Targets the 4–7 day PR backlog directly.",
        },
        {
          title: "Java/Spring + Oracle review patterns",
          why: "Matches their actual stack so it transfers Monday morning.",
        },
      ],
    },
    day2: {
      theme: "Day 2 — Agentic workflows + guardrails",
      modules: [
        {
          title: "Agentic PR triage",
          why: "Cuts senior-engineer review load below today's ~40%.",
        },
        {
          title: "Guardrails before the ERP migration",
          why: "De-risks AI use on critical migration code.",
        },
        {
          title: "Team review playbook",
          why: "Locks in the habit after the workshop ends.",
        },
      ],
    },
    dates: ["Week of 9 June 2026 — batch 1", "Week of 16 June 2026 — batch 2"],
    venue:
      "On-site at Bumimax HQ — keeps the ERP team in their environment and respects the listed-company security posture.",
    pricing: "18 pax × RM 3,500 = RM 63,000 + 8% SST (RM 5,040) = RM 68,040",
    caption: "Every module tied to something real about their business. In ten seconds.",
  },
  {
    id: "transfer",
    kind: "transfer",
    eyebrow: "The part you can't buy",
    reveal: {
      headline: "That call I just had?",
      sub: "The AI didn't just file it away —",
      button: "Turn my call into training",
    },
    techniques: [
      {
        tag: "Time objection",
        line: "Offer two batches instead of arguing the timeline.",
        from: "Bumimax call · today",
      },
      {
        tag: "Closing",
        line: "Recap every commitment out loud before you hang up.",
        from: "Coaching note · Bumimax",
      },
    ],
    drill: {
      prompt:
        "\"We're keen, but I can't pull the whole team off our migration for two days straight.\"",
      rubric: [
        "Offers a batched / split-cohort option",
        "Keeps the client's critical work staffed",
        "Re-confirms the dates before moving on",
      ],
    },
    caption:
      "Your next hire practices YOUR exact moves. Your selling skill becomes something you own — not something that walks out the door.",
  },
  {
    id: "close",
    kind: "close",
    eyebrow: "That's the whole loop",
    title: "Lead → call → proposal → close. Plus a system that trains the next person.",
    sub: "I'm not a developer. I built all of this with AI.",
    punch: "In two days, you'll build yours.",
    cta: "Join the workshop",
  },
];
