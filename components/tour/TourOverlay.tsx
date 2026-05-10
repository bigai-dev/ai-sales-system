"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/react";
import { useTour } from "./TourProvider";
import type { TourStep } from "@/lib/tour/types";

const SPOT_PAD = 10;
const SPOT_RADIUS = 14;

export default function TourOverlay() {
  const { active, step, index, totalSteps, next, prev, exit } = useTour();
  const [mounted, setMounted] = useState(false);

  // Portal target: only available after mount on client.
  useEffect(() => setMounted(true), []);

  if (!mounted || !active || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal>
      {step.placement === "center" ? (
        <CenterStep
          step={step}
          index={index}
          total={totalSteps}
          onNext={next}
          onPrev={prev}
          onExit={exit}
        />
      ) : (
        <AnchoredStep
          step={step}
          index={index}
          total={totalSteps}
          onNext={next}
          onPrev={prev}
          onExit={exit}
        />
      )}
    </div>,
    document.body,
  );
}

type StepProps = {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
};

function CenterStep({ step, index, total, onNext, onPrev, onExit }: StepProps) {
  return (
    <>
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onExit}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
        <Card
          step={step}
          index={index}
          total={total}
          onNext={onNext}
          onPrev={onPrev}
          onExit={onExit}
          floating={false}
        />
      </div>
    </>
  );
}

function AnchoredStep({ step, index, total, onNext, onPrev, onExit }: StepProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Poll for the anchor element after step changes — accounts for the
  // brief window between router.push and the new route's elements mounting.
  // If the anchor never appears (missing data, failed seed, route mismatch),
  // surface a centered fallback so the tour never silently breaks.
  useEffect(() => {
    if (!step.anchor) return;
    let cancelled = false;
    let attempts = 0;
    const find = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(step.anchor!);
      if (el) {
        setAnchor(el);
        setSearchFailed(false);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (++attempts < 60) setTimeout(find, 50); // up to 3s
      else setSearchFailed(true);
    };
    setAnchor(null);
    setSearchFailed(false);
    find();
    return () => {
      cancelled = true;
    };
  }, [step]);

  // Track anchor bounding rect through scroll, resize, and content shifts.
  useEffect(() => {
    if (!anchor) {
      setRect(null);
      return;
    }
    const update = () => setRect(anchor.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(anchor);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchor]);

  const { refs, floatingStyles, middlewareData, placement } = useFloating({
    elements: { reference: anchor },
    placement: step.placement as Placement,
    middleware: [
      offset(SPOT_PAD + 8),
      flip(),
      shift({ padding: 16 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Fallback: anchor never showed up. Render centered, no spotlight.
  if (searchFailed && !anchor) {
    return (
      <CenterStep
        step={step}
        index={index}
        total={total}
        onNext={onNext}
        onPrev={onPrev}
        onExit={onExit}
      />
    );
  }

  return (
    <>
      <Spotlight rect={rect} />
      {anchor && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-[101] pointer-events-auto"
        >
          <Card
            step={step}
            index={index}
            total={total}
            onNext={onNext}
            onPrev={onPrev}
            onExit={onExit}
            floating
          />
          <Arrow
            ref={arrowRef}
            placement={placement}
            x={middlewareData.arrow?.x}
            y={middlewareData.arrow?.y}
          />
        </div>
      )}
    </>
  );
}

function Spotlight({ rect }: { rect: DOMRect | null }) {
  // Before the anchor mounts, render plain dim so the page doesn't flash bright.
  if (!rect) {
    return (
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-hidden />
    );
  }
  const x = Math.max(0, rect.x - SPOT_PAD);
  const y = Math.max(0, rect.y - SPOT_PAD);
  const w = rect.width + SPOT_PAD * 2;
  const h = rect.height + SPOT_PAD * 2;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <mask id="tour-spotlight">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={SPOT_RADIUS}
            fill="black"
            style={{
              transition:
                "x 250ms ease, y 250ms ease, width 250ms ease, height 250ms ease",
            }}
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.72)"
        mask="url(#tour-spotlight)"
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={SPOT_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
        style={{
          transition:
            "x 250ms ease, y 250ms ease, width 250ms ease, height 250ms ease",
        }}
      />
    </svg>
  );
}

const Arrow = ({
  ref,
  placement,
  x,
  y,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  placement: Placement;
  x?: number;
  y?: number;
}) => {
  // Place the arrow on the side opposite the tooltip's placement.
  const side = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
  const opp = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
  return (
    <div
      ref={ref}
      className="absolute w-2.5 h-2.5 rotate-45 bg-surface border border-border-subtle"
      style={{
        left: x != null ? `${x}px` : undefined,
        top: y != null ? `${y}px` : undefined,
        [opp]: "-5px",
        // Hide the two borders that would intersect the tooltip body
        ...(opp === "bottom" && { borderTop: "none", borderLeft: "none" }),
        ...(opp === "top" && { borderBottom: "none", borderRight: "none" }),
        ...(opp === "left" && { borderTop: "none", borderRight: "none" }),
        ...(opp === "right" && { borderBottom: "none", borderLeft: "none" }),
      }}
      aria-hidden
    />
  );
};

function Card({
  step,
  index,
  total,
  onNext,
  onPrev,
  onExit,
  floating,
}: StepProps & { floating: boolean }) {
  const isLast = index === total - 1;
  const isFirst = index === 0;
  return (
    <div
      className={`pointer-events-auto rounded-xl border border-border-subtle bg-surface shadow-2xl ${
        floating ? "max-w-sm" : "max-w-md"
      } p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold">
          Step {index + 1} of {total}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="text-[11px] text-muted hover:text-foreground"
          aria-label="Exit tour"
        >
          Skip tour
        </button>
      </div>
      <div className="font-semibold text-base text-foreground">{step.title}</div>
      <div className="text-sm text-muted mt-2 leading-relaxed">{step.body}</div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-6 bg-accent" : "w-1.5 bg-border-subtle"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button type="button" onClick={onPrev} className="btn-ghost text-xs">
              Back
            </button>
          )}
          <button type="button" onClick={onNext} className="btn text-xs">
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
