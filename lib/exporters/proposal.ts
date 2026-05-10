import { formatMoney, formatMoneyExact } from "@/db/lib/money";
import {
  VENUE_LABEL,
  type ProposalOutput,
} from "@/lib/schemas/proposal";

export type ProposalPricing = {
  perPaxCents: number;
  cohortSize: number;
  subtotalCents: number;
  sstCents: number;
  totalCents: number;
};

export type ProposalDoc = {
  client: string;
  generatedAt: number;
  output: ProposalOutput;
  pricing: ProposalPricing;
};

export function buildProposalMarkdown(doc: ProposalDoc): string {
  const { client, generatedAt, output, pricing } = doc;
  const date = new Date(generatedAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const lines: string[] = [];

  lines.push(`# 2-day vibe-coding workshop proposal — ${client}`);
  lines.push(`_Prepared ${date}_`);
  lines.push(``);

  lines.push(`## Recommended cohort`);
  lines.push(`**Size:** ${output.cohortRecommendation.size} attendees`);
  lines.push(``);
  lines.push(output.cohortRecommendation.rationale);
  lines.push(``);

  lines.push(`## Day 1 — ${output.contentSplit.day1Theme}`);
  for (const m of output.contentSplit.day1Modules) {
    lines.push(`- **${m.title}** — ${m.rationale}`);
  }
  lines.push(``);

  lines.push(`## Day 2 — ${output.contentSplit.day2Theme}`);
  for (const m of output.contentSplit.day2Modules) {
    lines.push(`- **${m.title}** — ${m.rationale}`);
  }
  lines.push(``);

  lines.push(`## Proposed dates`);
  for (const d of output.proposedDates) {
    lines.push(`- ${d}`);
  }
  lines.push(``);

  lines.push(`## Venue`);
  lines.push(`**${VENUE_LABEL[output.logistics.venueRecommendation]}**`);
  lines.push(``);
  lines.push(output.logistics.venueRationale);
  lines.push(``);

  lines.push(`## Investment`);
  lines.push(
    `${pricing.cohortSize} pax × ${formatMoney(pricing.perPaxCents)}/pax = **${formatMoneyExact(pricing.subtotalCents)}** (excl. SST)`,
  );
  lines.push(`+ 8% SST: **${formatMoneyExact(pricing.sstCents)}**`);
  lines.push(`**Total invoiced: ${formatMoneyExact(pricing.totalCents)}**`);
  lines.push(``);

  lines.push(`## Suggested follow-ups`);
  for (const f of output.followUps) {
    lines.push(`- ${f}`);
  }
  lines.push(``);

  lines.push(`## Next steps`);
  for (const s of output.nextSteps) {
    lines.push(`- ${s}`);
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function computePricing(cohortSize: number): ProposalPricing {
  const PER_PAX_SEN = 350_000; // RM 3,500
  const subtotal = cohortSize * PER_PAX_SEN;
  const sst = Math.round(subtotal * 0.08);
  return {
    perPaxCents: PER_PAX_SEN,
    cohortSize,
    subtotalCents: subtotal,
    sstCents: sst,
    totalCents: subtotal + sst,
  };
}
