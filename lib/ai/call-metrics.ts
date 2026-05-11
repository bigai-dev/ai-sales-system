import type { CallBriefing } from "@/lib/schemas/call-briefing";
import type { CallDebrief } from "@/lib/schemas/call-debrief";
import type { SpancoCode } from "@/lib/constants/labels";

const SPANCO_ORDER: Record<SpancoCode, number> = {
  S: 0,
  P: 1,
  A: 2,
  N: 3,
  C: 4,
  O: 5,
};

export type CallMetricsInput = {
  briefing: CallBriefing | null;
  debrief: CallDebrief | null;
  talkPct: number | null;
};

export type CallMetricsRow = {
  stageProgression: number; // 0 or 1
  briefingAdherence: number | null; // 0 or 1, null when no briefing
  discoveryCoverage: number | null; // 0-100, null when no briefing
  objectionPreparedness: number | null; // 0-100, null when no briefing
  talkPct: number | null; // 0-100
};

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function computeCallMetrics(input: CallMetricsInput): CallMetricsRow {
  const { briefing, debrief, talkPct } = input;

  // talk balance is independent of briefing/debrief; derived from raw call.
  const talk = typeof talkPct === "number" ? talkPct : null;

  // Without a debrief there's nothing to score; emit zeros and nulls.
  if (!debrief) {
    return {
      stageProgression: 0,
      briefingAdherence: null,
      discoveryCoverage: null,
      objectionPreparedness: null,
      talkPct: talk,
    };
  }

  // Stage progression: did the debrief's suggestedStage land at or past the
  // briefing's targeted next stage? Without a briefing, fall back to "did the
  // suggestedStage exceed the entry stage" — but we don't snapshot entry,
  // so use a conservative 0 in the no-briefing case.
  let stageProgression = 0;
  if (briefing) {
    const beforeOrder = SPANCO_ORDER[briefing.nextStageMove.target] - 1;
    const afterOrder = SPANCO_ORDER[debrief.suggestedStage];
    stageProgression = afterOrder > beforeOrder ? 1 : 0;
  }

  if (!briefing || !debrief.briefingEval) {
    return {
      stageProgression,
      briefingAdherence: null,
      discoveryCoverage: null,
      objectionPreparedness: null,
      talkPct: talk,
    };
  }

  const ev = debrief.briefingEval;

  const briefingAdherence = ev.nextStageMoveLanded ? 1 : 0;

  const dqAnswered = ev.discoveryQuestionsAnswered.filter(Boolean).length;
  const dqTotal = briefing.discoveryQuestions.length;
  const discoveryCoverage = pct(dqAnswered, dqTotal);

  // Objection preparedness: of expected objections that surfaced, how many
  // were addressed? We approximate "addressed" as "the rep wrote it down in
  // debrief.objectionsRaised" — i.e. they noticed and engaged with it.
  // The boolean array tracks "did it surface"; we cross-check that the same
  // category appears in objectionsRaised to confirm engagement.
  const expected = briefing.expectedObjections;
  const raisedCategories = new Set(debrief.objectionsRaised.map((o) => o.category));
  let preparedHits = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const surfaced = ev.expectedObjectionsHit[i] === true;
    const engaged = raisedCategories.has(expected[i].category);
    if (surfaced && engaged) preparedHits += 1;
    if (!surfaced) {
      // If the LLM said the objection didn't surface, treat that as
      // "preparation worked, prospect didn't bring it up" — credit it.
      preparedHits += 1;
    }
  }
  const objectionPreparedness = pct(preparedHits, expected.length);

  return {
    stageProgression,
    briefingAdherence,
    discoveryCoverage,
    objectionPreparedness,
    talkPct: talk,
  };
}
