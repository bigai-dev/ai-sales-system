"use client";

import { useState, useTransition } from "react";
import { generateDrillScenario } from "@/lib/ai/scenario-generator";
import { gradeAndSaveDrill } from "@/lib/ai/response-grader";
import type { DrillBucket } from "@/lib/schemas/drill";
import type { ScenarioOutput } from "@/lib/schemas/drill";

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
  const [scenario, setScenario] = useState<ScenarioOutput | null>(null);
  const [response, setResponse] = useState("");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"idle" | "scenario" | "writing" | "grading" | "graded">(
    "idle",
  );

  function loadScenario() {
    setError(null);
    setGrade(null);
    setResponse("");
    setPhase("scenario");
    startTransition(async () => {
      const r = await generateDrillScenario(bucket);
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

  if (phase === "idle") {
    return (
      <div className="panel p-6 text-center">
        <div className="text-sm text-muted">
          Ready to drill the <span className="font-semibold text-foreground">{bucket}</span>{" "}
          bucket?
        </div>
        {initialBest && (
          <div className="text-xs text-muted mt-2">
            Your best in this bucket so far is <b className="text-foreground">{initialBest.grade}</b>.
            Beat it.
          </div>
        )}
        <button
          type="button"
          onClick={loadScenario}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
        >
          Start drill
        </button>
      </div>
    );
  }

  if (phase === "scenario") {
    return (
      <div className="panel p-6 text-sm text-muted">Generating a scenario…</div>
    );
  }

  return (
    <div className="space-y-4">
      {scenario && (
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-wider text-muted">Prospect says</div>
          <div className="mt-2 text-base italic">&ldquo;{scenario.scenario}&rdquo;</div>
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="text-xs uppercase tracking-wider text-muted">
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
        <label className="text-xs uppercase tracking-wider text-muted">Your response</label>
        <textarea
          className="mt-2 w-full min-h-[120px] rounded-md border border-border-subtle bg-surface p-3 text-sm focus:outline-none focus:border-accent"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type how you'd actually reply on the call…"
          disabled={phase === "grading" || phase === "graded"}
        />
        <div className="text-[11px] text-muted mt-1">
          {response.length} chars · streaks need ≥40 chars and grade ≥30
        </div>

        {error && <div className="text-xs delta-down mt-2">{error}</div>}

        <div className="mt-3 flex items-center gap-2">
          {phase === "writing" && (
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
            >
              Grade my response
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
              Drill another scenario
            </button>
          )}
        </div>
      </div>

      {grade && (
        <div className="panel p-5 border-l-4" style={{ borderLeftColor: gradeColor(grade.grade) }}>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">Grade</div>
              <div className="text-3xl font-semibold mt-1">{grade.grade}</div>
            </div>
            {grade.didExceedBest && (
              <span className="chip chip-good">New best 🎉</span>
            )}
          </div>
          <div className="mt-3 text-sm">{grade.feedback}</div>
          {grade.previousBest !== null && !grade.didExceedBest && (
            <div className="text-xs text-muted mt-2">
              Your best in this bucket is <b>{grade.previousBest}</b>. Try again.
            </div>
          )}
          {grade.previousBest === null && grade.didExceedBest && (
            <div className="text-xs text-muted mt-2">
              First drill in this bucket — this is now your best.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function gradeColor(g: number): string {
  if (g >= 80) return "var(--success, #4ade80)";
  if (g >= 60) return "var(--accent)";
  if (g >= 40) return "var(--warn, #f59e0b)";
  return "var(--bad, #ef4444)";
}
