import type { DemoTargets } from "@/lib/queries/demo-targets";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  // Tooltip placement relative to the anchor. "center" pins it to the
  // viewport center and skips the spotlight (used for welcome/closing cards).
  placement: TourPlacement;
  // Route to navigate to before showing this step. Function form lets the
  // step depend on demo targets resolved at tour start.
  route: (t: DemoTargets) => string;
  // CSS selector for the anchor. Omitted when placement is "center".
  anchor?: string;
};

export type TourState = {
  active: boolean;
  index: number;
  targets: DemoTargets | null;
};
