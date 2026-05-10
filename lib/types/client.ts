// Shared client/deal/discovery enum types.
// Single source of truth — every other file imports from here.

export type ClientStage =
  | "Lead"
  | "Qualified"
  | "Discovery"
  | "Proposal"
  | "Negotiation"
  | "Closed-won";

export type ClientSize = "SMB" | "Mid-market" | "Enterprise";

export type DecisionMakerStance = "champion" | "neutral" | "blocker";

export type DecisionMaker = {
  name: string;
  role: string;
  stance: DecisionMakerStance;
};
