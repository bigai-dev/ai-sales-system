import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoney, formatMoneyExact } from "@/db/lib/money";
import { VENUE_LABEL } from "@/lib/schemas/proposal";
import type { ProposalDoc } from "@/lib/exporters/proposal";

const C = {
  bg: "#FFFFFF",
  fg: "#1A1A1A",
  muted: "#6B6660",
  accent: "#F97316",
  border: "#E5E1DA",
  surface: "#F8F6F2",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.fg,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    paddingBottom: 14,
    marginBottom: 26,
  },
  brand: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.6,
    color: C.accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9.5,
    color: C.muted,
  },
  section: { marginBottom: 18 },
  h2: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  h3: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  body: { fontSize: 10, lineHeight: 1.55, color: C.fg },
  bodyMuted: { fontSize: 10, lineHeight: 1.55, color: C.muted },
  row: { flexDirection: "row", marginBottom: 5, gap: 6 },
  bullet: { fontSize: 11, color: C.accent, width: 8, lineHeight: 1.45 },
  rowText: { flex: 1, fontSize: 10, lineHeight: 1.55, color: C.fg },
  bold: { fontFamily: "Helvetica-Bold" },
  pricingTable: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 12,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  pricingTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: C.accent },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.muted,
  },
});

export function ProposalPdf({ doc }: { doc: ProposalDoc }) {
  const { client, generatedAt, output, pricing } = doc;
  const dateStr = new Date(generatedAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Document
      title={`Workshop proposal — ${client}`}
      author="SalesAI"
      creator="SalesAI"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>2-DAY VIBE-CODING WORKSHOP PROPOSAL</Text>
          <Text style={styles.title}>{client}</Text>
          <Text style={styles.subtitle}>Prepared {dateStr}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Recommended cohort</Text>
          <Text style={styles.h3}>{output.cohortRecommendation.size} attendees</Text>
          <Text style={styles.body}>{output.cohortRecommendation.rationale}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Day 1 — {output.contentSplit.day1Theme}</Text>
          {output.contentSplit.day1Modules.map((m, i) => (
            <View key={`d1-${i}`} style={styles.row}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.rowText}>
                <Text style={styles.bold}>{m.title}</Text>
                {" — "}
                {m.rationale}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Day 2 — {output.contentSplit.day2Theme}</Text>
          {output.contentSplit.day2Modules.map((m, i) => (
            <View key={`d2-${i}`} style={styles.row}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.rowText}>
                <Text style={styles.bold}>{m.title}</Text>
                {" — "}
                {m.rationale}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Proposed dates</Text>
          {output.proposedDates.map((d, i) => (
            <View key={`date-${i}`} style={styles.row}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.rowText}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Venue</Text>
          <Text style={styles.h3}>{VENUE_LABEL[output.logistics.venueRecommendation]}</Text>
          <Text style={styles.body}>{output.logistics.venueRationale}</Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.h2}>Investment</Text>
          <View style={styles.pricingTable}>
            <View style={styles.pricingRow}>
              <Text style={styles.body}>
                {pricing.cohortSize} pax × {formatMoney(pricing.perPaxCents)}/pax
              </Text>
              <Text style={styles.body}>{formatMoneyExact(pricing.subtotalCents)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.bodyMuted}>+ 8% SST</Text>
              <Text style={styles.bodyMuted}>{formatMoneyExact(pricing.sstCents)}</Text>
            </View>
            <View style={styles.pricingTotal}>
              <Text style={styles.totalLabel}>Total invoiced</Text>
              <Text style={styles.totalValue}>{formatMoneyExact(pricing.totalCents)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Suggested follow-ups</Text>
          {output.followUps.map((f, i) => (
            <View key={`fu-${i}`} style={styles.row}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.rowText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Next steps</Text>
          {output.nextSteps.map((s, i) => (
            <View key={`ns-${i}`} style={styles.row}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.rowText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>SalesAI · 2-day vibe-coding workshop</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
