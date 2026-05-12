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

  // Wait for the anchor element to mount on the new route. Server-rendered
  // pages backed by remote DBs (Turso/Tokyo) can take several seconds to hand
  // off — a fixed short polling window drops the tour into centered-fallback
  // mode prematurely. Strategy: try immediately, then watch the DOM via
  // MutationObserver until it appears, with a 15s hard timeout as the final
  // safety net so the tour never hangs.
  useEffect(() => {
    if (!step.anchor) return;
    let cancelled = false;
    setAnchor(null);
    setSearchFailed(false);

    const tryFind = (): boolean => {
      if (cancelled) return false;
      const el = document.querySelector<HTMLElement>(step.anchor!);
      if (!el) return false;
      setAnchor(el);
      setSearchFailed(false);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    };

    if (tryFind()) return;

    const observer = new MutationObserver(() => {
      if (tryFind()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (!tryFind()) setSearchFailed(true);
      observer.disconnect();
    }, 15000);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timeout);
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

  // For anchors taller/wider than the viewport (long task lists, full client
  // panels), the popover must sit next to the *visible* slice of the anchor,
  // not its off-screen extents. We render an invisible "ghost" element fixed
  // to the visible-slice rectangle and use it as Floating-UI's reference via
  // its callback-ref API. The original anchor still drives ARIA, scrolling,
  // and the spotlight overlay.
  const [ghostRect, setGhostRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!anchor) {
      setGhostRect(null);
      return;
    }
    const recompute = () => {
      const r = anchor.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const side = (step.placement ?? "bottom").split("-")[0];
      const fitsVertically = r.top >= 0 && r.bottom <= vh;
      const fitsHorizontally = r.left >= 0 && r.right <= vw;
      // If the anchor fully fits in the viewport, use its own rectangle —
      // Floating-UI will place the popover *outside* the anchor's edge, where
      // it won't overlap the anchor's content. The visible-slice strip below
      // is only needed for anchors that extend off-screen.
      if (
        ((side === "top" || side === "bottom") && fitsVertically) ||
        ((side === "left" || side === "right") && fitsHorizontally)
      ) {
        setGhostRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
        return;
      }
      // Anchor extends past the viewport on the relevant axis. Use a 1px
      // strip on the edge of the visible slice that matches the placement,
      // so Floating-UI has space on the opposite side to render the popover.
      const sliceTop = Math.max(0, Math.min(vh, r.top));
      const sliceBottom = Math.max(0, Math.min(vh, r.bottom));
      const sliceLeft = Math.max(0, Math.min(vw, r.left));
      const sliceRight = Math.max(0, Math.min(vw, r.right));
      const sliceWidth = Math.max(0, sliceRight - sliceLeft);
      const sliceHeight = Math.max(0, sliceBottom - sliceTop);
      let top = sliceTop;
      let left = sliceLeft;
      let width = sliceWidth;
      let height = sliceHeight;
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
      setGhostRect({ top, left, width, height });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(anchor);
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
    };
  }, [anchor, step.placement]);

  // Disable main-axis flip only for horizontal placements (left/right).
  // Rationale: flipping a horizontal popover to the opposite side lands it
  // over the sidebar (left) or off-screen (right). For top/bottom we *want*
  // flip to work — e.g. step 3's "bottom" needs to flip to "top" when the
  // today list is too tall to fit a popover below it.
  const placementSide = ((step.placement ?? "bottom") as string).split("-")[0];
  const isHorizontalPlacement =
    placementSide === "left" || placementSide === "right";

  const { refs, floatingStyles, middlewareData, placement, update } =
    useFloating({
      strategy: "fixed",
      placement: step.placement as Placement,
      middleware: [
        offset(SPOT_PAD + 8),
        flip({
          padding: 16,
          mainAxis: !isHorizontalPlacement,
          crossAxis: false,
        }),
        shift({ padding: 16, crossAxis: true }),
        arrow({ element: arrowRef }),
      ],
      whileElementsMounted: autoUpdate,
    });

  // Force a position recompute whenever the ghost rect changes (scroll/resize).
  useEffect(() => {
    update();
  }, [ghostRect, update]);

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
      {ghostRect && (
        <div
          ref={refs.setReference}
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
