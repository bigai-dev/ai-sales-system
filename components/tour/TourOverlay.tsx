"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
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

// true once we're on the client (a portal target exists); false during SSR.
const noSubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(noSubscribe, () => true, () => false);

export default function TourOverlay() {
  const { active, step, index, totalSteps, next, prev, exit } = useTour();
  const mounted = useMounted();

  if (!mounted || !active || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal>
      {step.placement === "center" ? (
        <CenterStep step={step} index={index} total={totalSteps} onNext={next} onPrev={prev} onExit={exit} />
      ) : (
        <AnchoredStep
          // A fresh component per step so anchor search state starts clean.
          key={step.id}
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onExit} aria-hidden />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <Card step={step} index={index} total={total} onNext={onNext} onPrev={onPrev} onExit={onExit} floating={false} />
      </div>
    </>
  );
}

type Box = { top: number; left: number; width: number; height: number };

/** The ghost rectangle Floating-UI should treat as the anchor: the anchor
 *  itself when it fits on screen, otherwise a 1px strip on the visible edge
 *  that matches the placement, so the popover has room on the other side. */
function ghostBoxFor(anchor: HTMLElement, placement: string | undefined): Box {
  const r = anchor.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const side = (placement ?? "bottom").split("-")[0];
  const fitsVertically = r.top >= 0 && r.bottom <= vh;
  const fitsHorizontally = r.left >= 0 && r.right <= vw;
  if (
    ((side === "top" || side === "bottom") && fitsVertically) ||
    ((side === "left" || side === "right") && fitsHorizontally)
  ) {
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  const sliceTop = Math.max(0, Math.min(vh, r.top));
  const sliceBottom = Math.max(0, Math.min(vh, r.bottom));
  const sliceLeft = Math.max(0, Math.min(vw, r.left));
  const sliceRight = Math.max(0, Math.min(vw, r.right));
  let top = sliceTop;
  let left = sliceLeft;
  let width = Math.max(0, sliceRight - sliceLeft);
  let height = Math.max(0, sliceBottom - sliceTop);
  if (side === "top") {
    top = Math.max(0, sliceBottom - 1);
    height = 1;
  } else if (side === "bottom") {
    height = 1;
  } else if (side === "left") {
    left = Math.max(0, sliceRight - 1);
    width = 1;
  } else if (side === "right") {
    width = 1;
  }
  return { top, left, width, height };
}

function AnchoredStep({ step, index, total, onNext, onPrev, onExit }: StepProps) {
  // Search result for this step's anchor. "searching" until found or timed out.
  const [search, setSearch] = useState<
    { status: "searching" } | { status: "found"; anchor: HTMLElement } | { status: "failed" }
  >({ status: "searching" });
  const anchor = search.status === "found" ? search.anchor : null;

  // Geometry is stored together with the anchor it was measured for, so a
  // stale measurement from a previous anchor is never shown.
  const [geometry, setGeometry] = useState<{ anchor: HTMLElement; rect: DOMRect; ghost: Box } | null>(null);
  const rect = geometry && geometry.anchor === anchor ? geometry.rect : null;
  const ghostRect = geometry && geometry.anchor === anchor ? geometry.ghost : null;

  // Floating-UI gets its two elements as plain state (no ref objects).
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);
  const [ghostEl, setGhostEl] = useState<HTMLDivElement | null>(null);
  const [popoverEl, setPopoverEl] = useState<HTMLDivElement | null>(null);

  // Wait for the anchor element to mount on the new route. Server-rendered
  // pages backed by a remote database can take several seconds, so watch the
  // DOM until it appears, with a 15s hard timeout so the tour never hangs.
  // The first look happens on the next frame, never during the effect itself.
  useEffect(() => {
    if (!step.anchor) return;
    let cancelled = false;
    const selector = step.anchor;

    const tryFind = (): boolean => {
      if (cancelled) return false;
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return false;
      setSearch({ status: "found", anchor: el });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    };

    const observer = new MutationObserver(() => {
      if (tryFind()) observer.disconnect();
    });
    const frame = requestAnimationFrame(() => {
      if (tryFind()) return;
      observer.observe(document.body, { childList: true, subtree: true });
    });
    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (!tryFind()) setSearch({ status: "failed" });
      observer.disconnect();
    }, 15000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [step.anchor]);

  // Track the anchor's position through scroll, resize and content shifts.
  useEffect(() => {
    if (!anchor) return;
    const measure = () =>
      setGeometry({ anchor, rect: anchor.getBoundingClientRect(), ghost: ghostBoxFor(anchor, step.placement) });
    const frame = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(anchor);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [anchor, step.placement]);

  // Disable main-axis flip only for horizontal placements (left/right):
  // flipping those lands the popover over the sidebar or off-screen. For
  // top/bottom we want flip, e.g. when the Today list is too tall.
  const placementSide = ((step.placement ?? "bottom") as string).split("-")[0];
  const isHorizontalPlacement = placementSide === "left" || placementSide === "right";

  const floating = useFloating({
    elements: { reference: ghostEl, floating: popoverEl },
    strategy: "fixed",
    placement: step.placement as Placement,
    middleware: [
      offset(SPOT_PAD + 8),
      flip({ padding: 16, mainAxis: !isHorizontalPlacement, crossAxis: false }),
      shift({ padding: 16, crossAxis: true }),
      arrow({ element: arrowEl }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { floatingStyles, middlewareData, placement, update } = floating;

  // Recompute the popover position whenever the ghost rectangle moves.
  useEffect(() => {
    update();
  }, [ghostRect, update]);

  // Fallback: anchor never showed up. Render centered, no spotlight.
  if (search.status === "failed") {
    return <CenterStep step={step} index={index} total={total} onNext={onNext} onPrev={onPrev} onExit={onExit} />;
  }

  return (
    <>
      <Spotlight rect={rect} />
      {ghostRect && (
        <div
          ref={setGhostEl}
          aria-hidden
          style={{
            position: "fixed",
            top: ghostRect.top,
            left: ghostRect.left,
            width: ghostRect.width,
            height: ghostRect.height,
            pointerEvents: "none",
            visibility: "hidden",
          }}
        />
      )}
      {anchor && ghostRect && (
        <div ref={setPopoverEl} style={floatingStyles} className="pointer-events-auto z-[101]">
          <Card step={step} index={index} total={total} onNext={onNext} onPrev={onPrev} onExit={onExit} floating />
          <Arrow setEl={setArrowEl} placement={placement} x={middlewareData.arrow?.x} y={middlewareData.arrow?.y} />
        </div>
      )}
    </>
  );
}

function Spotlight({ rect }: { rect: DOMRect | null }) {
  // Before the anchor mounts, render plain dim so the page doesn't flash bright.
  if (!rect) {
    return <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-hidden />;
  }
  const x = Math.max(0, rect.x - SPOT_PAD);
  const y = Math.max(0, rect.y - SPOT_PAD);
  const w = rect.width + SPOT_PAD * 2;
  const h = rect.height + SPOT_PAD * 2;
  const transition = "x 250ms ease, y 250ms ease, width 250ms ease, height 250ms ease";

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <mask id="tour-spotlight">
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={SPOT_RADIUS} fill="black" style={{ transition }} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-spotlight)" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={SPOT_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
        style={{ transition }}
      />
    </svg>
  );
}

function Arrow({
  setEl,
  placement,
  x,
  y,
}: {
  setEl: (el: HTMLDivElement | null) => void;
  placement: Placement;
  x?: number;
  y?: number;
}) {
  // Place the arrow on the side opposite the tooltip's placement.
  const side = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
  const opp = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
  return (
    <div
      ref={setEl}
      className="absolute h-2.5 w-2.5 rotate-45 border border-border-subtle bg-surface"
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
}

function Card({ step, index, total, onNext, onPrev, onExit, floating }: StepProps & { floating: boolean }) {
  const isLast = index === total - 1;
  const isFirst = index === 0;
  return (
    <div
      className={`pointer-events-auto rounded-xl border border-border-subtle bg-surface p-5 shadow-2xl ${
        floating ? "max-w-sm" : "max-w-md"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold text-muted">
          Step {index + 1} of {total}
        </div>
        <button type="button" onClick={onExit} className="text-xs text-muted hover:text-foreground" aria-label="Exit tour">
          Skip tour
        </button>
      </div>
      <div className="text-base font-semibold text-foreground">{step.title}</div>
      <div className="mt-2 text-sm leading-relaxed text-muted">{step.body}</div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-1.5 bg-border-subtle"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button type="button" onClick={onPrev} className="btn-ghost btn-sm">
              Back
            </button>
          )}
          <button type="button" onClick={onNext} className="btn btn-sm">
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
