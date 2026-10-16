"use client";

import { useState, useTransition, type ReactNode } from "react";
import { generateDrillScenario } from "@/lib/ai/scenario-generator";
import { gradeAndSaveDrill } from "@/lib/ai/response-grader";
import {
  DRILL_BUCKET_SITUATIONS,
  DRILL_FOCUS_MAX_CHARS,
  type DrillBucket,
  type ScenarioOutput,
} from "@/lib/schemas/drill";

type GradeResult = {
  grade: number;
  feedback: string;
  didExceedBest: boolean;
  previousBest: number | null;
};

type Props = {
  bucket: DrillBucket;
  initialBest: { grade: number; excerpt: string } | null;
};

export default function DrillForm({ bucket, initialBest }: Props) {
  // What the rep chose to practice: a ready-made situation, their own words,
  // or neither ("Surprise me"). Typed text wins over a picked situation.
  const [preset, setPreset] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [scenario, setScenario] = useState<ScenarioOutput | null>(null);
  const [response, setResponse] = useState("");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"idle" | "scenario" | "writing" | "grading" | "graded">(
    "idle",
  );

  const focus = custom.trim() || preset || "";

  function loadScenario() {
    setError(null);
    setGrade(null);
    setResponse("");
    setPhase("scenario");
    startTransition(async () => {
      const r = await generateDrillScenario(bucket, focus);
      if (!r.ok) {
        setError(r.error);
        setPhase("idle");
        return;
      }
      setScenario(r.data);
      setPhase("writing");
    });
  }

  function submit() {
    if (!scenario) return;
    const trimmed = response.trim();
    if (trimmed.length < 10) {
      setError("Write at least a sentence before grading.");
      return;
    }
    setError(null);
    setPhase("grading");
    startTransition(async () => {
      const r = await gradeAndSaveDrill({
        bucket,
        scenarioPrompt: scenario.scenario,
        rubric: scenario.rubric,
        repResponse: trimmed,
      });
      if (!r.ok) {
        setError(r.error);
        setPhase("writing");
        return;
      }
      setGrade(r.data);
      setPhase("graded");
    });
  }

  function reset() {
    setScenario(null);
    setResponse("");
    setGrade(null);
    setError(null);
    loadScenario();
  }

  // Back to the picker, keeping the last choice selected.
  function chooseAgain() {
    setScenario(null);
    setResponse("");
    setGrade(null);
    setError(null);
    setPhase("idle");
  }

  if (phase === "idle") {
    return (
      <div className="panel p-6">
        <div className="font-semibold">What do you want to practice?</div>
        <div className="text-sm text-muted mt-1">
          Pick a situation and the AI plays a prospect who brings it up. You type your reply and
          get a score.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SituationChip
            active={!custom.trim() && preset === null}
            onClick={() => {
              setPreset(null);
              setCustom("");
            }}
          >
            Surprise me
          </SituationChip>
          {DRILL_BUCKET_SITUATIONS[bucket].map((s) => (
            <SituationChip
              key={s}
              active={!custom.trim() && preset === s}
              onClick={() => {
                setPreset(s);
                setCustom("");
              }}
            >
              {s}
            </SituationChip>
          ))}
        </div>

        <label
          htmlFor="role-play-focus"
          className="block mt-5 text-xs text-muted"
        >
          Or type your own situation
        </label>
        <input
          id="role-play-focus"
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadScenario();
          }}
          maxLength={DRILL_FOCUS_MAX_CHARS}
          placeholder="e.g. They say another trainer quoted half our price"
          className="mt-2 w-full rounded-md border border-border-subtle bg-surface p-3 text-sm focus:outline-none focus:border-accent"
        />

        {initialBest && (
          <div className="text-xs text-muted mt-4">
            Your best on this topic so far is <b className="text-foreground">{initialBest.grade}</b>.
            Beat it.
          </div>
        )}

        {error && <div className="text-xs delta-down mt-3">{error}</div>}

        <button
          type="button"
          onClick={loadScenario}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
        >
          Start role play
        </button>
      </div>
    );
  }

  if (phase === "scenario") {
    return (
      <div className="panel p-6 text-sm text-muted">
        {focus ? (
          <>
            Setting up a role play on{" "}
            <span className="text-foreground">&ldquo;{focus}&rdquo;</span>…
          </>
        ) : (
          "Setting up a role play…"
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenario && (
        <div className="panel p-5">
          {focus && (
            <div className="text-xs text-muted mb-3">
              Practicing: <span className="text-foreground">{focus}</span>
            </div>
          )}
          <div className="text-xs text-muted">Prospect says</div>
          <div className="mt-2 text-base italic">&ldquo;{scenario.scenario}&rdquo;</div>
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="text-xs text-muted">
              What good looks like
            </div>
            <ul className="mt-1 text-xs text-muted space-y-1 list-disc pl-5">
              {scenario.rubric.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="panel p-5">
        <label className="text-xs text-muted">Your response</label>
        <textarea
          className="mt-2 w-full min-h-[120px] rounded-md border border-border-subtle bg-surface p-3 text-sm focus:outline-none focus:border-accent"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type how you'd actually reply on the call…"
          disabled={phase === "grading" || phase === "graded"}
        />
        <div className="text-xs text-muted mt-1">
          {response.length} chars · write a full reply (40+ characters) for it to count toward your streak
        </div>

        {error && <div className="text-xs delta-down mt-2">{error}</div>}

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {phase === "writing" && (
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
            >
              Score my reply
            </button>
          )}
          {phase === "grading" && (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-lg bg-accent/60 text-accent-foreground text-sm font-semibold"
            >
              Grading…
            </button>
          )}
          {phase === "graded" && (
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
            >
              {focus ? "Another one like this" : "Try another one"}
            </button>
          )}
          {(phase === "writing" || phase === "graded") && (
            <button
              type="button"
              onClick={chooseAgain}
              disabled={pending}
              className="px-4 py-2 rounded-lg border border-border-subtle text-sm font-semibold hover:bg-surface-elevated"
            >
              Choose something else
            </button>
          )}
        </div>
      </div>

      {grade && (
        <div className="panel p-5 border-l-4" style={{ borderLeftColor: gradeColor(grade.grade) }}>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Score</div>
              <div className="text-3xl font-semibold mt-1">{grade.grade}</div>
            </div>
            {grade.didExceedBest && (
              <span className="chip chip-good">New best</span>
            )}
          </div>
          <div className="mt-3 text-sm">{grade.feedback}</div>
          {grade.previousBest !== null && !grade.didExceedBest && (
            <div className="text-xs text-muted mt-2">
              Your best on this topic is <b>{grade.previousBest}</b>. Try again.
            </div>
          )}
          {grade.previousBest === null && grade.didExceedBest && (
            <div className="text-xs text-muted mt-2">
              First role play on this topic — this is now your best.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SituationChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-sm px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "border-border-subtle text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function gradeColor(g: number): string {
  if (g >= 80) return "var(--success, #4ade80)";
  if (g >= 60) return "var(--accent)";
  if (g >= 40) return "var(--warning)";
  return "var(--danger)";
}
