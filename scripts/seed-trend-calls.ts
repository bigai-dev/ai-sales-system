/*
 * Fill the Training → Trends page with sample calls for demo purposes.
 *
 * Trends only counts calls analyzed in the last 30 days (and its headline
 * numbers only the last 7), so a demo database goes blank as soon as its
 * calls age out. This writes 14 finished calls dated relative to TODAY —
 * 9 in days 8-30, 5 in the last week — each with a briefing, a debrief and
 * a matching call_metrics row computed by the app's own computeCallMetrics.
 *
 *   npm run trends:refresh   remove the previous batch, write a fresh one
 *   npm run trends:clear     remove the batch and write nothing
 *
 * Only rows whose id starts with "demo_trend_" are ever touched. Re-run it
 * whenever Trends has thinned out again (roughly weekly before a demo).
 *
 * Deliberate choices, so the sample calls don't disturb other screens:
 *  - calls.nextStep is left empty, so /today gets no follow-up tasks from
 *    them (the next step still shows inside the debrief on the call page).
 *  - The newest call belongs to Bumimax, because the product tour jumps to
 *    the most recently analyzed call and its later steps need Bumimax.
 *  - GoBeli gets no calls: a newer call would hide its "chase proposal" task.
 */
import { db } from "@/db/client";
import { calls, callMetrics, clients, deals, reps } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { computeCallMetrics, type CallMetricsRow } from "@/lib/ai/call-metrics";
import { callBriefingSchema, type CallBriefing } from "@/lib/schemas/call-briefing";
import { callDebriefSchema, type CallDebrief } from "@/lib/schemas/call-debrief";

const ID_PREFIX = "demo_trend_";
const DAY_MS = 24 * 60 * 60 * 1000;
// Asia/Kuala_Lumpur is UTC+8 year-round (no DST).
const KL_OFFSET_MS = 8 * 60 * 60 * 1000;

type Stage = "S" | "P" | "A" | "N" | "C" | "O";
type Category = "content" | "budget" | "venue" | "time";

// What happened to an objection the briefing told the rep to expect:
//   handled — it came up and the rep dealt with it
//   missed  — it came up and the rep let it pass
//   quiet   — it never came up
type Fate = "handled" | "missed" | "quiet";

type Spec = {
  client: string;
  // Which of the client's deals the call is about (matters for Bumimax,
  // which has a won deal and a new one).
  dealStage: Stage;
  title: string;
  // Business days before today, and KL wall-clock start time.
  bizDaysAgo: number;
  hour: number;
  minute: number;
  durationMin: number;
  talkPct: number;
  questionsAsked: number;
  sentiment: number;
  context: string;
  questions: [string, string][]; // [question, why]
  answered: number; // how many of `questions`, from the top, got answered
  expected: [Category, Fate][];
  target: Stage;
  move: string;
  landed: boolean;
  watchouts: string[];
  outcome: CallDebrief["outcome"];
  suggestedStage: Stage;
  summary: string;
  // The handled objections, as the rep noted them. Must cover exactly the
  // categories marked "handled" above.
  raised: [Category, string][];
  commitments: ["rep" | "client", string][];
  nextStep: string;
  coachingNote: string;
  notes: string;
};

const OBJECTION: Record<Category, { objection: string; response: string }> = {
  budget: {
    objection: "RM 3,500 per pax plus 8% SST is steep for a two-day course.",
    response:
      "Anchor on output: one sprint of faster code reviews pays back the seat. Offer split invoicing across two months before touching the per-pax rate.",
  },
  time: {
    objection: "We can't pull the whole team off delivery for two straight days.",
    response:
      "Offer split cohorts — half the team in each run — or place the two days a week apart so releases stay staffed.",
  },
  content: {
    objection: "Our seniors already use Copilot; this may be too basic for them.",
    response:
      "Day 2 is the advanced track — custom agents and review workflows — and the seniors lead the build exercise.",
  },
  venue: {
    objection: "We would rather run it at our own office than travel to a venue.",
    response:
      "On-site works for 12 pax and above; we bring the kit and only need a room with stable Wi-Fi and a projector.",
  },
};

const Q_HEADCOUNT: [string, string] = [
  "How many developers would join, and what is the senior/junior mix?",
  "Cohorts cap at 35; the mix decides whether it is one batch or two.",
];
const Q_AI_TODAY: [string, string] = [
  "Where do AI coding tools sit in the team's daily work today?",
  "Sets how fast Day 1 can move and which modules to stress.",
];
const Q_APPROVAL: [string, string] = [
  "Who signs off on training spend, and what does approval look like?",
  "Surfaces the real decision-maker and any timeline risk early.",
];

// Oldest first. Calls 01-09 land in days 8-30, calls 10-14 in the last week.
const SPECS: Spec[] = [
  {
    client: "TradieMy Sdn Bhd",
    dealStage: "S",
    title: "Intro call · TradieMy",
    bizDaysAgo: 20,
    hour: 10,
    minute: 0,
    durationMin: 28,
    talkPct: 58,
    questionsAsked: 3,
    sentiment: 0,
    context:
      "TradieMy is a new Suspect from a LinkedIn enquiry, with no calls yet. Goal: qualify — confirm team size, AI maturity and whether a training budget exists this year.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 1,
    expected: [
      ["budget", "missed"],
      ["content", "quiet"],
    ],
    target: "P",
    move: "Confirm there is a training budget this year and get Nurul to name who approves it.",
    landed: false,
    watchouts: ["Nurul may not control budget — listen for 'I need to check with the CEO'."],
    outcome: "follow_up",
    suggestedStage: "S",
    summary:
      "Introductory call with Nurul at TradieMy. Confirmed an 18-developer team; most of the call went on walking through the agenda. Pricing came up late and was left open, and the approval path was not established.",
    raised: [],
    commitments: [
      ["rep", "Email the two-day agenda and a one-page pricing summary."],
      ["client", "Raise the workshop with the CEO this week."],
    ],
    nextStep:
      "Send the agenda and pricing one-pager today, then call Nurul on Thursday to ask who approves training spend.",
    coachingNote:
      "You talked for most of the call and the budget question arrived with two minutes left. Ask who approves spend in the first ten minutes next time.",
    notes:
      "Intro with Nurul. 18 devs, mostly mid-level. Walked through the full 2-day agenda, ran long. She asked about price near the end, said RM 3,500 a head is a lot. Did not get to who approves budget. She will speak to her CEO.",
  },
  {
    client: "Kopikat Technologies Sdn Bhd",
    dealStage: "P",
    title: "Re-engage after proposal · Kopikat",
    bizDaysAgo: 18,
    hour: 14,
    minute: 30,
    durationMin: 32,
    talkPct: 55,
    questionsAsked: 4,
    sentiment: 0,
    context:
      "Kopikat received a 12-pax proposal in July and went quiet. Goal: re-qualify the opportunity and find out what stalled it.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 1,
    expected: [
      ["budget", "handled"],
      ["time", "missed"],
      ["content", "quiet"],
    ],
    target: "P",
    move: "Get Faisal to confirm the 12-pax cohort is still wanted and name a target month.",
    landed: false,
    watchouts: ["Runway is tight — he may agree in principle and still stall on dates."],
    outcome: "connected",
    suggestedStage: "P",
    summary:
      "Reconnected with Faisal after the July proposal went quiet. He still wants a 12-pax cohort but flagged cost against a tight runway and would not commit to a month. Team availability during their payments launch was mentioned but not explored.",
    raised: [
      ["budget", "Faisal said RM 3,500 a head is hard to justify while they are watching runway."],
    ],
    commitments: [
      ["rep", "Send a split-invoicing option across two months."],
      ["client", "Check the Q4 training allocation with his co-founder."],
    ],
    nextStep:
      "Send the split-invoicing option by Wednesday and ask for a target month in the same email.",
    coachingNote:
      "Good recovery on price with the split-invoice idea. But when he mentioned the payments launch you moved on — that was the real scheduling objection and it went unanswered.",
    notes:
      "Faisal still keen on 12 pax. Says runway is tight, RM 3,500 a head hard to justify right now. Offered to split the invoice over two months, he liked that. Mentioned a payments launch coming. No month agreed.",
  },
  {
    client: "Selasih Logistics Sdn Bhd",
    dealStage: "P",
    title: "Discovery · Selasih Logistics",
    bizDaysAgo: 17,
    hour: 11,
    minute: 0,
    durationMin: 35,
    talkPct: 54,
    questionsAsked: 5,
    sentiment: 1,
    context:
      "Selasih is a Prospect after an inbound enquiry from Wei Ming. Goal: complete discovery and agree a needs-analysis session with his team leads.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 2,
    expected: [
      ["time", "missed"],
      ["venue", "quiet"],
    ],
    target: "A",
    move: "Agree a needs-analysis session with Wei Ming and his two team leads within two weeks.",
    landed: false,
    watchouts: ["Peak season is close — expect push-back on any two-day block."],
    outcome: "follow_up",
    suggestedStage: "P",
    summary:
      "Discovery call with Wei Ming. Fifteen developers, about half already using Copilot informally. He raised peak-season workload as a blocker for a two-day block; no alternative was offered and the approval path was not covered.",
    raised: [],
    commitments: [
      ["rep", "Share sample Day 1 exercises relevant to logistics systems."],
      ["client", "Check which weeks are clear of peak-season cutovers."],
    ],
    nextStep:
      "Send the sample exercises tomorrow and propose two split-cohort date options that avoid peak season.",
    coachingNote:
      "Solid questions on team size and current AI use. When he said peak season makes two days impossible, the split-cohort answer was in your briefing and you did not use it.",
    notes:
      "Wei Ming: 15 devs, roughly half use Copilot on their own. Peak season coming, says two days off is impossible. Did not ask about budget approval. He will check which weeks are clear.",
  },
  {
    client: "Petalwise Sdn Bhd",
    dealStage: "P",
    title: "Discovery · Petalwise",
    bizDaysAgo: 15,
    hour: 15,
    minute: 0,
    durationMin: 16,
    talkPct: 50,
    questionsAsked: 3,
    sentiment: 0,
    context:
      "Petalwise is a small Prospect: 8 developers, founder-led. Goal: confirm fit for a team this size and agree a needs-analysis session.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 1,
    expected: [
      ["budget", "handled"],
      ["content", "missed"],
    ],
    target: "A",
    move: "Agree a needs-analysis session with Aishah and her lead developer.",
    landed: false,
    watchouts: ["Aishah is the CEO and short on time — keep the opening tight."],
    outcome: "rescheduled",
    suggestedStage: "P",
    summary:
      "The call with Aishah was cut short after 15 minutes by a supplier issue. She confirmed 8 developers and questioned the price for a team that size. Her worry that the content may be too advanced for juniors was not addressed before the call ended.",
    raised: [
      ["budget", "Aishah asked whether RM 3,500 each makes sense for a team of only eight."],
    ],
    commitments: [
      ["rep", "Send a calendar invite for the rescheduled call."],
      ["client", "Join the rescheduled call together with her lead developer."],
    ],
    nextStep:
      "Rebook for next Tuesday with her lead developer on the call, and open with the content-level question.",
    coachingNote:
      "You handled the small-team pricing question calmly. With a CEO who is short on time, lead with the two questions that matter most instead of the agenda walkthrough.",
    notes:
      "Aishah had to drop after 15 min, supplier problem. 8 devs. Asked if RM 3,500 each makes sense for such a small team. Also worried it is too advanced for her juniors, ran out of time to answer. Rescheduling.",
  },
  {
    client: "MyEduConnect Sdn Bhd",
    dealStage: "A",
    title: "Needs analysis · MyEduConnect",
    bizDaysAgo: 13,
    hour: 10,
    minute: 30,
    durationMin: 40,
    talkPct: 49,
    questionsAsked: 6,
    sentiment: 1,
    context:
      "MyEduConnect has had two proposals since June (24 and 32 pax) and is still sizing the cohort. Goal: lock a needs-analysis session so a final scope can be written.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 2,
    expected: [
      ["content", "handled"],
      ["budget", "quiet"],
      ["time", "missed"],
    ],
    target: "A",
    move: "Get Lee Hoon to commit to a needs-analysis session with her squad leads.",
    landed: true,
    watchouts: ["School-term release dates drive their calendar."],
    outcome: "connected",
    suggestedStage: "A",
    summary:
      "Lee Hoon agreed to a needs-analysis session with her four squad leads next week. She questioned whether seniors would find the content too basic; the advanced Day 2 track answered that. School-term release pressure was raised but left open.",
    raised: [["content", "Lee Hoon worried her senior engineers would find it too basic."]],
    commitments: [
      ["rep", "Send the Day 2 advanced-track outline before the session."],
      ["client", "Bring four squad leads to the needs-analysis session."],
    ],
    nextStep: "Send the Day 2 outline today and confirm the needs-analysis slot for next Wednesday.",
    coachingNote:
      "Strong handling of the 'too basic' worry — you let her finish, then showed the Day 2 track. Next time pin down the school-term timing issue before hanging up.",
    notes:
      "Lee Hoon ok to do a needs-analysis session with 4 squad leads next week. Worried seniors find it too basic, showed her Day 2 advanced track, she was fine. Mentioned school-term releases. 32 devs total.",
  },
  {
    client: "Padu Cipta Manufacturing Solutions Sdn Bhd",
    dealStage: "P",
    title: "Discovery · Padu Cipta",
    bizDaysAgo: 12,
    hour: 16,
    minute: 0,
    durationMin: 30,
    talkPct: 52,
    questionsAsked: 4,
    sentiment: 0,
    context:
      "Padu Cipta had a 20-pax proposal in May that never progressed. Goal: reopen discovery and agree a needs-analysis session.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 1,
    expected: [
      ["venue", "handled"],
      ["budget", "missed"],
    ],
    target: "A",
    move: "Agree a needs-analysis session and a 20-minute slot with finance.",
    landed: false,
    watchouts: ["The May quote may already be over what finance expects."],
    outcome: "follow_up",
    suggestedStage: "P",
    summary:
      "Ibrahim wants any workshop run at their Shah Alam plant so engineers stay near the production line; on-site delivery was confirmed as workable. He hinted the earlier 20-pax quote was above what finance expects. This was not explored and no next meeting was fixed.",
    raised: [
      ["venue", "Ibrahim wants it on-site at the Shah Alam plant, not at an outside venue."],
    ],
    commitments: [
      ["rep", "Send the on-site room and equipment checklist."],
      ["client", "Ask finance what ceiling applies to training this year."],
    ],
    nextStep:
      "Send the on-site checklist tomorrow and ask Ibrahim for 20 minutes with finance next week.",
    coachingNote:
      "Good, direct answer on the on-site question. He told you the quote was over finance's expectation and you did not ask what the number was — that is the deal.",
    notes:
      "Ibrahim wants it at the Shah Alam plant, engineers must stay near the line. Told him on-site is fine for 20 pax. He said the May quote was more than finance expected. 22 devs. No next meeting fixed.",
  },
  {
    client: "Klinika Health Sdn Bhd",
    dealStage: "N",
    title: "Pricing call · Klinika Health",
    bizDaysAgo: 10,
    hour: 11,
    minute: 30,
    durationMin: 34,
    talkPct: 47,
    questionsAsked: 6,
    sentiment: 1,
    context:
      "Klinika has a 14-pax proposal from July and has finished its internal review. Goal: move into Negotiation by agreeing commercial terms in principle.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 2,
    expected: [
      ["budget", "handled"],
      ["time", "quiet"],
    ],
    target: "N",
    move: "Get Dr. Vinod to agree the 14-pax scope and move to discussing payment terms.",
    landed: true,
    watchouts: ["His co-founder co-signs anything commercial."],
    outcome: "connected",
    suggestedStage: "N",
    summary:
      "Dr. Vinod confirmed the 14-pax scope and opened the discussion on terms. He pushed on the per-pax rate; the rate was held and a 50/50 split invoice was offered instead, which he will take to his co-founder.",
    raised: [
      ["budget", "Dr. Vinod asked for a lower per-pax rate since all 14 seats are from one company."],
    ],
    commitments: [
      ["rep", "Send revised terms with a 50/50 split invoice."],
      ["client", "Review the terms with his co-founder by Friday."],
    ],
    nextStep:
      "Send the 50/50 split-invoice terms today and book a 15-minute decision call for Monday.",
    coachingNote:
      "You held the rate and traded on payment timing instead — exactly right. You are still doing nearly half the talking; let his silences run longer.",
    notes:
      "Dr. Vinod confirms 14 pax. Asked for a lower rate since all seats are one company. Held the rate, offered 50/50 split invoice. He will take it to his co-founder by Friday.",
  },
  {
    client: "Agromart Networks Sdn Bhd",
    dealStage: "C",
    title: "Negotiation · Agromart",
    bizDaysAgo: 8,
    hour: 14,
    minute: 0,
    durationMin: 38,
    talkPct: 46,
    questionsAsked: 7,
    sentiment: 1,
    context:
      "Agromart has finished needs analysis for its two engineering squads. Goal: move to Negotiation by agreeing how the cohort is structured and priced.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 2,
    expected: [
      ["budget", "handled"],
      ["venue", "missed"],
      ["content", "quiet"],
    ],
    target: "N",
    move: "Get Priya to agree the cohort structure and move to commercial terms.",
    landed: true,
    watchouts: ["Large invoices need a second director's signature."],
    outcome: "connected",
    suggestedStage: "N",
    summary:
      "Priya confirmed 28 developers across two squads and agreed to move to commercial terms. Budget needs a second director's sign-off above RM 50,000, which shaped a two-cohort structure. Her question about holding it at their Penang office was noted but not answered.",
    raised: [
      ["budget", "Anything above RM 50,000 needs a second director's signature, Priya said."],
    ],
    commitments: [
      ["rep", "Draft a two-cohort quote that keeps each invoice under the sign-off threshold."],
      ["client", "Confirm how the developers split between the two cohorts."],
    ],
    nextStep:
      "Send the two-cohort quote by Thursday and answer the Penang on-site question in the same email.",
    coachingNote:
      "Smart restructure around the RM 50,000 threshold — you turned an approval problem into a format. Do not leave the venue question hanging; small unanswered points slow the paperwork.",
    notes:
      "Priya: 28 devs, two squads. Anything over RM 50k needs a second director to sign. Suggested two cohorts so each invoice stays under. She asked about doing it at the Penang office, did not answer properly.",
  },
  {
    client: "Rentak Media Sdn Bhd",
    dealStage: "C",
    title: "Closing call · Rentak Media",
    bizDaysAgo: 6,
    hour: 10,
    minute: 0,
    durationMin: 36,
    talkPct: 44,
    questionsAsked: 6,
    sentiment: 1,
    context:
      "Rentak Media is in Negotiation on an 18-pax workshop and terms are broadly agreed. Goal: get the verbal yes and a signing date.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 2,
    expected: [
      ["time", "handled"],
      ["budget", "handled"],
    ],
    target: "C",
    move: "Get a verbal yes on the 18-pax split-cohort plan and agree a signing date.",
    landed: false,
    watchouts: ["The MD makes the final call and is not on this invite."],
    outcome: "follow_up",
    suggestedStage: "N",
    summary:
      "Siew Ling is ready to proceed but could not give a verbal yes without her MD. Campaign-season timing and total cost both came up and were handled with a split cohort and staged invoicing. The decision now sits with the MD.",
    raised: [
      ["time", "Siew Ling said two full days in campaign season would stall client work."],
      ["budget", "She asked whether the total could be staged across two months."],
    ],
    commitments: [
      ["rep", "Prepare a one-page summary for the MD."],
      ["client", "Get 20 minutes with the MD this week."],
    ],
    nextStep:
      "Send the MD one-pager tomorrow morning and ask Siew Ling to add you to the MD meeting.",
    coachingNote:
      "Both objections were handled cleanly and in few words. The miss was upstream: the MD should have been invited to this call, as the briefing flagged.",
    notes:
      "Siew Ling wants to go ahead, cannot say yes without the MD. Campaign season worry, offered split cohort. Asked to stage the cost over two months, said yes. She will get me 20 min with the MD.",
  },
  {
    client: "Agromart Networks Sdn Bhd",
    dealStage: "C",
    title: "Closing call · Agromart",
    bizDaysAgo: 4,
    hour: 11,
    minute: 0,
    durationMin: 30,
    talkPct: 41,
    questionsAsked: 8,
    sentiment: 2,
    context:
      "Agromart has the two-cohort quote, built to keep each invoice under the RM 50,000 sign-off threshold. Goal: get the verbal yes and a signing date.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 3,
    expected: [
      ["budget", "handled"],
      ["time", "handled"],
    ],
    target: "C",
    move: "Get Priya's verbal yes on two cohorts of 14 and agree a signing date.",
    landed: true,
    watchouts: ["Harvest-season releases limit which weeks the team can step away."],
    outcome: "connected",
    suggestedStage: "C",
    summary:
      "Priya gave a verbal yes on two cohorts of 14 and agreed a signing date. The second director's sign-off is in hand because each invoice stays under RM 50,000. Harvest-season release dates were worked around by placing the cohorts three weeks apart.",
    raised: [
      ["budget", "Priya checked once more that each invoice stays below the RM 50,000 sign-off line."],
      ["time", "She did not want both cohorts inside the harvest-season release window."],
    ],
    commitments: [
      ["rep", "Send the agreement and both invoices for signature."],
      ["client", "Return the signed agreement by next Friday."],
      ["client", "Book the Penang office training room for both cohorts."],
    ],
    nextStep:
      "Send the agreement and both invoices today; confirm cohort dates in writing once Priya signs.",
    coachingNote:
      "Best call of the month: all three discovery points confirmed in the first ten minutes, then you asked for the yes directly and stopped talking.",
    notes:
      "Priya says yes to 2 cohorts of 14. Second director fine as each invoice is under RM 50k. Must avoid harvest-season release window, so cohorts three weeks apart. Penang office room. Signing by next Friday.",
  },
  {
    client: "MyEduConnect Sdn Bhd",
    dealStage: "A",
    title: "Pricing prep · MyEduConnect",
    bizDaysAgo: 3,
    hour: 15,
    minute: 30,
    durationMin: 33,
    talkPct: 39,
    questionsAsked: 7,
    sentiment: 1,
    context:
      "MyEduConnect has completed needs analysis for a 32-pax cohort. Goal: open Negotiation by getting the CFO into the pricing conversation.",
    questions: [Q_HEADCOUNT, Q_APPROVAL, Q_AI_TODAY],
    answered: 2,
    expected: [
      ["budget", "handled"],
      ["time", "missed"],
      ["content", "quiet"],
    ],
    target: "N",
    move: "Get Lee Hoon to agree to a pricing call with her CFO present.",
    landed: true,
    watchouts: ["Exam-week timing has come up before without an answer."],
    outcome: "follow_up",
    suggestedStage: "A",
    summary:
      "Lee Hoon agreed to bring her CFO to a pricing call next week, which is the commitment this call was for. She raised cost for a 32-pax cohort and accepted a two-batch structure. Exam-week timing came up again and still has no answer.",
    raised: [
      ["budget", "Lee Hoon said 32 seats at full rate will be a hard number to put in front of the CFO."],
    ],
    commitments: [
      ["rep", "Prepare a two-batch pricing sheet for the CFO call."],
      ["client", "Invite the CFO and confirm a slot next week."],
    ],
    nextStep:
      "Send the two-batch pricing sheet by Thursday and propose dates that avoid exam weeks before the CFO call.",
    coachingNote:
      "You got exactly the commitment the briefing asked for. The exam-week timing issue has now been raised twice without an answer — bring date options to the CFO call.",
    notes:
      "Lee Hoon will bring the CFO to a pricing call next week. 32 seats at full rate is a hard number for the CFO, suggested two batches, she agreed. Exam weeks mentioned again. Need date options.",
  },
  {
    client: "Rentak Media Sdn Bhd",
    dealStage: "C",
    title: "Decision call · Rentak Media",
    bizDaysAgo: 2,
    hour: 10,
    minute: 30,
    durationMin: 27,
    talkPct: 36,
    questionsAsked: 7,
    sentiment: 2,
    context:
      "Rentak Media's MD has the one-page summary and has joined this call. Goal: get the verbal yes on the 18-pax split cohort and a signing date.",
    questions: [Q_APPROVAL, Q_HEADCOUNT, Q_AI_TODAY],
    answered: 3,
    expected: [
      ["time", "handled"],
      ["venue", "quiet"],
    ],
    target: "C",
    move: "Get the MD's verbal yes on the 18-pax split cohort and agree a signing date.",
    landed: true,
    watchouts: ["Year-end campaigns are the MD's first priority."],
    outcome: "connected",
    suggestedStage: "C",
    summary:
      "With the MD on the call, Rentak gave a verbal yes to an 18-pax split cohort and set a signing date. The MD's only concern was campaign-season timing, resolved by scheduling both halves after the year-end campaign rush.",
    raised: [
      ["time", "The MD did not want anyone off client work before the year-end campaigns ship."],
    ],
    commitments: [
      ["rep", "Send the agreement with post-campaign dates."],
      ["client", "Sign and return the agreement by the agreed date."],
    ],
    nextStep: "Send the agreement with the two post-campaign date options today.",
    coachingNote:
      "Getting the MD on the call changed everything. You asked three questions, listened, and let Siew Ling make the case internally — well under 40% talk time.",
    notes:
      "MD joined. Verbal yes on 18 pax split cohort. Only worry: nobody off client work before year-end campaigns ship. Agreed both halves run after the rush. Signing date set.",
  },
  {
    client: "Kopikat Technologies Sdn Bhd",
    dealStage: "P",
    title: "Follow-up · Kopikat",
    bizDaysAgo: 2,
    hour: 15,
    minute: 0,
    durationMin: 24,
    talkPct: 38,
    questionsAsked: 6,
    sentiment: 0,
    context:
      "Kopikat has the split-invoicing option and remains interested in 12 pax. Goal: move to Analysis by fixing a needs-analysis session and a target month.",
    questions: [Q_HEADCOUNT, Q_AI_TODAY, Q_APPROVAL],
    answered: 2,
    expected: [
      ["budget", "handled"],
      ["time", "missed"],
    ],
    target: "A",
    move: "Get Faisal to commit to a needs-analysis session and name a target month.",
    landed: false,
    watchouts: ["The payments launch is the real scheduling blocker."],
    outcome: "follow_up",
    suggestedStage: "P",
    summary:
      "Faisal likes the split-invoicing option but still would not name a month. Runway caution remains his stated reason. The payments-launch schedule came up again as the practical blocker and no dates were proposed around it.",
    raised: [
      ["budget", "Faisal said even split in two, it is a real chunk of this quarter's budget."],
    ],
    commitments: [
      ["rep", "Send two date options that fall after the payments launch."],
      ["client", "Reply with the launch date once it is fixed."],
    ],
    nextStep: "Email two post-launch date options tomorrow and ask Faisal to pencil one in.",
    coachingNote:
      "Discovery was sharper this time and you kept your talk time down. The launch schedule is what is actually holding this deal — propose dates around it instead of re-arguing price.",
    notes:
      "Faisal likes the split invoice. Still no month. Says even in two parts it is a real chunk of the quarter's budget. Payments launch came up again, that is the real blocker. 12 devs, all would join.",
  },
  {
    client: "Bumimax Industrial Bhd",
    dealStage: "S",
    title: "Second cohort · Bumimax",
    bizDaysAgo: 1,
    hour: 16,
    minute: 0,
    durationMin: 29,
    talkPct: 35,
    questionsAsked: 8,
    sentiment: 2,
    context:
      "Bumimax completed its first 18-pax workshop (closed-won). A new opportunity is open for a second, larger group. Goal: qualify it — who, how many, and whether budget is set aside.",
    questions: [
      [
        "Which teams would join the second round, and how many people?",
        "Sizes the opportunity and decides one batch or two.",
      ],
      [
        "What has changed in how the first cohort works since the workshop?",
        "Their own results are the strongest case for a second round.",
      ],
      [
        "Is budget for a second round already set aside, and who approves it?",
        "Confirms this is a real opportunity this financial year.",
      ],
    ],
    answered: 3,
    expected: [
      ["time", "handled"],
      ["content", "quiet"],
    ],
    target: "P",
    move: "Confirm the second group's size and that Anitha has budget set aside this financial year.",
    landed: true,
    watchouts: ["The ERP go-live is still running — avoid those weeks."],
    outcome: "connected",
    suggestedStage: "P",
    summary:
      "Anitha confirmed a second round for about 28 people from the plant-systems and data teams, with budget already set aside this financial year. She reported the first cohort now reviews code noticeably faster. Her one concern was overlap with the ERP go-live, handled by scheduling after it.",
    raised: [
      ["time", "Anitha does not want the second round to clash with the ERP go-live weeks."],
    ],
    commitments: [
      ["rep", "Send a proposal for a 28-pax second round in two batches."],
      ["client", "Share the ERP go-live calendar so the dates can avoid it."],
      ["client", "Introduce the plant-systems team lead."],
    ],
    nextStep:
      "Send the 28-pax second-round proposal by Friday, with dates after the ERP go-live.",
    coachingNote:
      "Textbook qualifying call: you asked about results from the first cohort before pitching anything, and Anitha sold the second round to herself. Keep opening repeat-business calls this way.",
    notes:
      "Anitha wants a second round, about 28 people from plant-systems and data. Budget already set aside this FY. Says first cohort reviews code much faster now. Must not clash with ERP go-live weeks. Will intro the plant-systems lead.",
  },
];

type Row = {
  id: string;
  spec: Spec;
  metrics: CallMetricsRow;
  analyzedAt: number;
  call: typeof calls.$inferInsert;
};

function buildBriefing(s: Spec): CallBriefing {
  return callBriefingSchema.parse({
    context: s.context,
    discoveryQuestions: s.questions.map(([question, why]) => ({ question, why })),
    expectedObjections: s.expected.map(([category]) => ({ category, ...OBJECTION[category] })),
    nextStageMove: { target: s.target, what: s.move },
    watchouts: s.watchouts,
  });
}

function buildDebrief(s: Spec): CallDebrief {
  const handled = s.expected.filter(([, fate]) => fate === "handled").map(([c]) => c);
  const raised = s.raised.map(([c]) => c);
  if (handled.join() !== raised.join()) {
    throw new Error(`${s.title}: 'raised' must list exactly the handled objections, in order`);
  }
  return callDebriefSchema.parse({
    outcome: s.outcome,
    summary: s.summary,
    objectionsRaised: s.raised.map(([category, verbatim]) => ({ category, verbatim })),
    commitments: s.commitments.map(([who, what]) => ({ who, what })),
    nextStep: s.nextStep,
    suggestedStage: s.suggestedStage,
    coachingNote: s.coachingNote,
    briefingEval: {
      discoveryQuestionsAnswered: s.questions.map((_, i) => i < s.answered),
      expectedObjectionsHit: s.expected.map(([, fate]) => fate !== "quiet"),
      nextStageMoveLanded: s.landed,
    },
  });
}

// KL wall-clock time on the weekday that is `bizDaysAgo` business days
// before today, as a UTC timestamp.
function businessDaysAgo(now: number, bizDaysAgo: number, hour: number, minute: number): number {
  const kl = new Date(now + KL_OFFSET_MS);
  let day = Date.UTC(kl.getUTCFullYear(), kl.getUTCMonth(), kl.getUTCDate());
  let left = bizDaysAgo;
  while (left > 0) {
    day -= DAY_MS;
    const dow = new Date(day).getUTCDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return day + hour * 3_600_000 + minute * 60_000 - KL_OFFSET_MS;
}

async function removeBatch(): Promise<number> {
  // call_metrics cascades from calls, but delete it explicitly so this still
  // works on a database where foreign keys are switched off.
  await db.delete(callMetrics).where(like(callMetrics.callId, `${ID_PREFIX}%`));
  const gone = await db
    .delete(calls)
    .where(like(calls.id, `${ID_PREFIX}%`))
    .returning({ id: calls.id });
  return gone.length;
}

async function main() {
  if (process.argv.includes("--remove")) {
    console.log(`Removed ${await removeBatch()} sample trend calls.`);
    return;
  }

  const now = Date.now();
  const [primary] = await db.select().from(reps).where(eq(reps.isPrimary, true));
  const allClients = await db.select({ id: clients.id, name: clients.name }).from(clients);
  const allDeals = await db
    .select({ id: deals.id, clientId: deals.clientId, stage: deals.stage })
    .from(deals);

  // Build and validate everything before touching the database.
  const rows: Row[] = [];
  for (const [i, s] of SPECS.entries()) {
    const client = allClients.find((c) => c.name === s.client);
    if (!client) {
      console.warn(`- skipped "${s.title}": client "${s.client}" is not in this database`);
      continue;
    }
    const clientDeals = allDeals.filter((d) => d.clientId === client.id);
    const deal = clientDeals.find((d) => d.stage === s.dealStage) ?? clientDeals[0];

    const startedAt = businessDaysAgo(now, s.bizDaysAgo, s.hour, s.minute);
    const endedAt = startedAt + s.durationMin * 60_000;
    const analyzedAt = endedAt + 8 * 60_000;
    const briefing = buildBriefing(s);
    const debrief = buildDebrief(s);
    const metrics = computeCallMetrics({ briefing, debrief, talkPct: s.talkPct });

    const id = `${ID_PREFIX}${String(i + 1).padStart(2, "0")}`;
    rows.push({
      id,
      spec: s,
      metrics,
      analyzedAt,
      call: {
        id,
        clientId: client.id,
        dealId: deal?.id ?? null,
        repId: primary?.id ?? null,
        title: s.title,
        status: "completed",
        scheduledAt: startedAt,
        startedAt,
        endedAt,
        talkPct: s.talkPct,
        questionsAsked: s.questionsAsked,
        sentiment: s.sentiment,
        summary: debrief.summary,
        briefing,
        notes: s.notes,
        debrief,
        outcome: debrief.outcome,
        // Left empty on purpose — see the header comment.
        nextStep: null,
        suggestedStage: debrief.suggestedStage,
        analyzedAt,
      },
    });
  }

  if (rows.length === 0) {
    throw new Error("None of the sample clients exist in this database — nothing to write.");
  }
  const newest = rows.reduce((a, b) => (b.analyzedAt > a.analyzedAt ? b : a));
  if (rows.some((r) => r.analyzedAt >= now || r.analyzedAt < now - 30 * DAY_MS)) {
    throw new Error("A sample call fell outside the last 30 days — refusing to write.");
  }

  const removed = await removeBatch();
  for (const r of rows) {
    await db.insert(calls).values(r.call);
    await db.insert(callMetrics).values({ callId: r.id, ...r.metrics });
  }

  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  const recent = rows.filter((r) => r.analyzedAt >= now - 7 * DAY_MS);
  const prior = rows.filter((r) => r.analyzedAt < now - 7 * DAY_MS);
  const line = (label: string, pick: (m: CallMetricsRow) => number | null) => {
    const of = (set: Row[]) =>
      avg(set.map((r) => pick(r.metrics)).filter((v): v is number => v !== null));
    console.log(`  ${label.padEnd(24)} last 7 days: ${of(recent)}%   days 8-30: ${of(prior)}%`);
  };

  console.log(`Replaced ${removed} old sample calls with ${rows.length} new ones.`);
  console.log(`  ${recent.length} in the last 7 days, ${prior.length} in days 8-30.`);
  line("Stage progression", (m) => m.stageProgression * 100);
  line("Briefing adherence", (m) => (m.briefingAdherence === null ? null : m.briefingAdherence * 100));
  line("Discovery coverage", (m) => m.discoveryCoverage);
  line("Objection preparedness", (m) => m.objectionPreparedness);
  line("Talk balance", (m) => m.talkPct);
  console.log(`  Newest call (the product tour opens this one): ${newest.spec.title}`);
  console.log("Trends is cached for up to 5 minutes, so the page may take a moment to catch up.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
