"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMovie } from "./MovieProvider";
import {
  SCENES,
  type BriefingScene,
  type CallScene,
  type ClientScene,
  type CloseScene,
  type DebriefScene,
  type ProposalScene,
  type Scene,
  type TitleScene,
  type TransferScene,
} from "@/lib/movie/script";

// How long the "AI is thinking…" shimmer plays before the pre-baked result
// reveals. Long enough to feel like real work, short enough to keep the room.
const THINK_MS = 1400;

type Phase = "pre" | "thinking" | "shown";

export default function MovieOverlay() {
  // Remounted by MovieProvider (via `key`) each time the demo starts, so state
  // begins fresh at scene 0 without a reset effect.
  const { active, exit } = useMovie();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(SCENES[0]!.reveal ? "pre" : "shown");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = SCENES[i]!;
  const hasReveal = Boolean(scene.reveal);
  const isLast = i === SCENES.length - 1;

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Clear any pending reveal timer on unmount.
  useEffect(() => clearTimer, []);

  const reveal = useCallback(() => {
    clearTimer();
    setPhase("thinking");
    timer.current = setTimeout(() => setPhase("shown"), THINK_MS);
  }, []);

  const next = useCallback(() => {
    // On a reveal scene that hasn't fired yet, the first press IS the reveal.
    if (hasReveal && phase === "pre") {
      reveal();
      return;
    }
    if (phase === "thinking") {
      // Skip the shimmer if the presenter is moving fast.
      clearTimer();
      setPhase("shown");
      return;
    }
    if (isLast) {
      exit();
      return;
    }
    const ni = i + 1;
    setI(ni);
    setPhase(SCENES[ni]!.reveal ? "pre" : "shown");
  }, [hasReveal, phase, isLast, i, reveal, exit]);

  const prev = useCallback(() => {
    // Step back over a reveal first, so it can be re-played.
    if (hasReveal && phase !== "pre") {
      clearTimer();
      setPhase("pre");
      return;
    }
    if (i === 0) return;
    const ni = i - 1;
    setI(ni);
    // Landing on a previous scene shows it fully (already "performed").
    setPhase("shown");
  }, [hasReveal, phase, i]);

  // Lock body scroll while presenting.
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  // Keyboard: → / Enter / Space advance, ← back, Esc exit.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
      else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, exit, next, prev]);

  if (!active) return null;

  const showSetup = hasReveal && phase === "pre";
  const showThinking = hasReveal && phase === "thinking";

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex flex-col text-white"
      role="dialog"
      aria-modal
      aria-label="Webinar demo"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, oklch(0.30 0.10 48 / 0.45), transparent 60%), linear-gradient(160deg, #0b0a10 0%, #14111b 55%, #0a0910 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-12 pt-6">
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "oklch(0.78 0.16 48)" }}
          >
            {scene.eyebrow}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {i + 1} / {SCENES.length}
          </span>
          <button
            type="button"
            onClick={exit}
            className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/60 transition hover:text-white hover:border-white/40"
          >
            Exit · Esc
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 flex items-center justify-center">
        <div key={`${scene.id}-${phase}`} className="movie-fade-up w-full max-w-5xl">
          {showSetup && scene.reveal ? (
            <RevealSetup reveal={scene.reveal} onReveal={next} />
          ) : showThinking ? (
            <Thinking />
          ) : (
            <SceneBody scene={scene} />
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between px-6 md:px-12 pb-6">
        <div className="flex gap-1.5">
          {SCENES.map((s, idx) => (
            <span
              key={s.id}
              className="h-1 rounded-full transition-all"
              style={{
                width: idx === i ? 26 : 7,
                background:
                  idx === i ? "oklch(0.78 0.16 48)" : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-[11px] text-white/35 mr-2">
            ← → to move
          </span>
          {i > 0 && (
            <button
              type="button"
              onClick={prev}
              className="rounded-md border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/70 transition hover:text-white hover:border-white/40"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="rounded-md px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-black transition hover:brightness-110"
            style={{ background: "oklch(0.78 0.16 48)" }}
          >
            {showSetup
              ? "Reveal"
              : isLast && phase === "shown"
                ? "Finish"
                : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------- shared bits ----------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
      style={{ color: "oklch(0.78 0.16 48)" }}
    >
      {children}
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-7 text-center text-base md:text-lg text-white/55 max-w-3xl mx-auto">
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function Sparkles({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 4.9L18.7 9l-4.9 1.8L12 16l-1.8-5.2L5.3 9l4.9-2.1L12 2zM19 14l.9 2.4L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.6L19 14zM5 14l.9 2.4L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.6L5 14z" />
    </svg>
  );
}

function RevealSetup({
  reveal,
  onReveal,
}: {
  reveal: NonNullable<Scene["reveal"]>;
  onReveal: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
        {reveal.headline}
      </h2>
      <p className="mt-4 text-lg md:text-2xl text-white/55">{reveal.sub}</p>
      <button
        type="button"
        onClick={onReveal}
        className="mt-10 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-lg transition hover:brightness-110"
        style={{
          background: "oklch(0.78 0.16 48)",
          boxShadow: "0 0 40px oklch(0.72 0.185 48 / 0.45)",
        }}
      >
        <Sparkles />
        {reveal.button}
      </button>
    </div>
  );
}

function Thinking() {
  return (
    <div className="text-center">
      <div
        className="inline-flex items-center gap-2.5 text-base font-semibold uppercase tracking-[0.2em]"
        style={{ color: "oklch(0.82 0.14 48)" }}
      >
        <span className="movie-shimmer">
          <Sparkles size={18} />
        </span>
        Generating with AI…
      </div>
      <div className="mt-8 mx-auto max-w-2xl space-y-3">
        {[100, 88, 94, 72, 90, 60].map((w, idx) => (
          <div
            key={idx}
            className="movie-shimmer h-3 rounded-full bg-white/10"
            style={{ width: `${w}%`, animationDelay: `${idx * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ scene body ----------------------------- */

function SceneBody({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case "title":
      return <TitleView scene={scene} />;
    case "client":
      return <ClientView scene={scene} />;
    case "briefing":
      return <BriefingView scene={scene} />;
    case "call":
      return <CallView scene={scene} />;
    case "debrief":
      return <DebriefView scene={scene} />;
    case "proposal":
      return <ProposalView scene={scene} />;
    case "transfer":
      return <TransferView scene={scene} />;
    case "close":
      return <CloseView scene={scene} />;
  }
}

function TitleView({ scene }: { scene: TitleScene }) {
  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
        {scene.title}
      </h1>
      <p className="mt-6 text-lg md:text-2xl text-white/60 max-w-3xl mx-auto">
        {scene.sub}
      </p>
      <p className="mt-12 text-[11px] uppercase tracking-[0.25em] text-white/35">
        Press → to begin
      </p>
    </div>
  );
}

function ClientView({ scene }: { scene: ClientScene }) {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
          {scene.company}
        </h2>
        <p className="mt-3 text-sm md:text-base text-white/50">{scene.meta}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {scene.contacts.map((c) => (
            <span
              key={c.name}
              className="rounded-full border border-white/12 bg-white/4 px-3 py-1 text-xs text-white/75"
            >
              {c.name} · {c.role}
              {c.tag ? (
                <span style={{ color: "oklch(0.82 0.14 48)" }}> · {c.tag}</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {scene.facts.map((f) => (
          <Panel key={f.label}>
            <div className="text-[11px] uppercase tracking-wider text-white/40">
              {f.label}
            </div>
            <div className="mt-1.5 text-base md:text-lg leading-snug">
              {f.value}
            </div>
          </Panel>
        ))}
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function BriefingView({ scene }: { scene: BriefingScene }) {
  return (
    <div>
      <Eyebrow>AI call brief</Eyebrow>
      <p className="text-lg md:text-xl leading-snug text-white/85">
        {scene.context}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
            Ask these
          </div>
          <ul className="space-y-3">
            {scene.questions.map((q) => (
              <li key={q.question}>
                <div className="text-sm md:text-base font-medium">{q.question}</div>
                <div className="text-xs md:text-sm text-white/45 mt-0.5">{q.why}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
            Objections coming — and your answer
          </div>
          <ul className="space-y-3">
            {scene.objections.map((o) => (
              <li key={o.objection}>
                <div className="text-sm md:text-base font-medium">
                  <span style={{ color: "oklch(0.82 0.14 48)" }}>{o.tag}: </span>
                  “{o.objection}”
                </div>
                <div className="text-xs md:text-sm text-white/55 mt-0.5">
                  → {o.response}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <Panel className="bg-white/6!">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Win this call
          </div>
          <div className="mt-1 text-sm md:text-base">{scene.goal}</div>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Watch out
          </div>
          <div className="mt-1 text-sm md:text-base text-white/70">
            {scene.watchout}
          </div>
        </Panel>
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function CallView({ scene }: { scene: CallScene }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Eyebrow>Live call</Eyebrow>
      <div className="space-y-3">
        {scene.turns.map((t, idx) =>
          t.who === "ai" ? (
            <div
              key={idx}
              className="mx-auto max-w-xl rounded-xl border px-4 py-2.5 text-center text-sm"
              style={{
                borderColor: "oklch(0.72 0.185 48 / 0.4)",
                background: "oklch(0.72 0.185 48 / 0.12)",
                color: "oklch(0.85 0.13 48)",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} /> {t.text}
              </span>
            </div>
          ) : (
            <div
              key={idx}
              className={`flex ${t.who === "rep" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  t.who === "rep"
                    ? "rounded-br-sm bg-white/10"
                    : "rounded-bl-sm bg-white/5 border border-white/10"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
                  {t.name}
                </div>
                <div className="text-sm md:text-base leading-snug">{t.text}</div>
              </div>
            </div>
          ),
        )}
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function DebriefView({ scene }: { scene: DebriefScene }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Eyebrow>AI debrief</Eyebrow>
        <span
          className="-mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: "oklch(0.6 0.15 145 / 0.18)",
            color: "oklch(0.82 0.15 145)",
          }}
        >
          {scene.outcome}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Panel>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Summary
            </div>
            <div className="text-sm md:text-base leading-snug">{scene.summary}</div>
          </Panel>
          <Panel>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">
              Commitments
            </div>
            <ul className="space-y-1.5 text-sm md:text-base">
              {scene.commitments.map((c) => (
                <li key={c} className="flex gap-2">
                  <span style={{ color: "oklch(0.82 0.14 48)" }}>•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="bg-white/6!">
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Coaching note
            </div>
            <div className="text-sm md:text-base leading-snug text-white/85">
              {scene.coaching}
            </div>
          </Panel>
        </div>
        <Panel className="flex flex-col">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
            Follow-up email · drafted for you
          </div>
          <div className="rounded-lg bg-black/30 border border-white/10 p-3.5 text-sm leading-relaxed">
            <div className="font-semibold">{scene.email.subject}</div>
            <div className="mt-2 whitespace-pre-line text-white/75 text-[13px]">
              {scene.email.body}
            </div>
          </div>
          <div className="mt-2 text-xs text-white/45">
            📎 {scene.email.attachment}
          </div>
        </Panel>
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function ModuleList({
  theme,
  modules,
}: {
  theme: string;
  modules: { title: string; why: string }[];
}) {
  return (
    <Panel>
      <div className="text-sm font-semibold" style={{ color: "oklch(0.85 0.12 48)" }}>
        {theme}
      </div>
      <ul className="mt-2.5 space-y-2">
        {modules.map((m) => (
          <li key={m.title}>
            <div className="text-sm md:text-base font-medium">{m.title}</div>
            <div className="text-xs md:text-sm text-white/45">{m.why}</div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ProposalView({ scene }: { scene: ProposalScene }) {
  return (
    <div>
      <Eyebrow>AI-generated proposal · 2-day workshop</Eyebrow>
      <div className="grid gap-4 md:grid-cols-2">
        <ModuleList theme={scene.day1.theme} modules={scene.day1.modules} />
        <ModuleList theme={scene.day2.theme} modules={scene.day2.modules} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Panel>
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Cohort
          </div>
          <div className="mt-1 text-sm text-white/75 leading-snug">{scene.cohort}</div>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Dates · venue
          </div>
          <ul className="mt-1 text-sm text-white/75 space-y-0.5">
            {scene.dates.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <div className="mt-1.5 text-xs text-white/45">{scene.venue}</div>
        </Panel>
        <Panel className="bg-white/[0.07]! flex flex-col justify-center">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Investment
          </div>
          <div
            className="mt-1 text-base md:text-lg font-semibold leading-snug"
            style={{ color: "oklch(0.85 0.12 48)" }}
          >
            {scene.pricing}
          </div>
        </Panel>
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function TransferView({ scene }: { scene: TransferScene }) {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
          From one call → reusable skill
        </h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] items-center">
        {/* Captured techniques */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            The AI pulled out what worked
          </div>
          {scene.techniques.map((t) => (
            <Panel key={t.line}>
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "oklch(0.82 0.14 48)" }}
              >
                {t.tag}
              </div>
              <div className="mt-1 text-sm md:text-base font-medium">{t.line}</div>
              <div className="text-xs text-white/40 mt-0.5">{t.from}</div>
            </Panel>
          ))}
        </div>

        <div className="hidden md:block text-3xl text-white/30">→</div>

        {/* The drill */}
        <Panel className="bg-white/6!">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
            Turned into a 2-minute drill for your next hire
          </div>
          <div className="rounded-lg bg-black/30 border border-white/10 p-3.5">
            <div className="text-sm md:text-base font-medium">{scene.drill.prompt}</div>
            <div className="mt-3 text-[11px] uppercase tracking-wider text-white/40">
              Graded on
            </div>
            <ul className="mt-1 space-y-1 text-sm text-white/75">
              {scene.drill.rubric.map((r) => (
                <li key={r} className="flex gap-2">
                  <span style={{ color: "oklch(0.82 0.15 145)" }}>✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
      <Caption>{scene.caption}</Caption>
    </div>
  );
}

function CloseView({ scene }: { scene: CloseScene }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-6xl font-semibold tracking-tight leading-[1.08] max-w-4xl mx-auto">
        {scene.title}
      </h2>
      <p className="mt-6 text-lg md:text-2xl text-white/60">{scene.sub}</p>
      <p
        className="mt-8 text-2xl md:text-4xl font-semibold"
        style={{ color: "oklch(0.82 0.14 48)" }}
      >
        {scene.punch}
      </p>
      <div
        className="mt-10 inline-block rounded-full px-8 py-4 text-base font-bold uppercase tracking-wider text-black"
        style={{
          background: "oklch(0.78 0.16 48)",
          boxShadow: "0 0 50px oklch(0.72 0.185 48 / 0.5)",
        }}
      >
        {scene.cta}
      </div>
    </div>
  );
}
