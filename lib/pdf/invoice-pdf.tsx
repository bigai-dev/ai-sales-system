import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoneyExact } from "@/db/lib/money";
import { COMPANY } from "@/lib/invoice/company";

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
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    paddingBottom: 14,
    marginBottom: 26,
  },
  brandBlock: { maxWidth: 260 },
  brandName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  brandLine: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.5,
  },
  invoiceBlock: { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  invoiceMeta: {
    fontSize: 9,
    color: C.muted,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 32,
  },
  colHeader: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  colBody: { fontSize: 10, lineHeight: 1.5, color: C.fg },
  colBodyBold: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },

  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableHeaderCell: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.0,
    color: C.muted,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cellDescription: { flex: 4, fontSize: 10 },
  cellQty: { flex: 1, fontSize: 10, textAlign: "right" },
  cellUnit: { flex: 1.4, fontSize: 10, textAlign: "right" },
  cellAmount: { flex: 1.4, fontSize: 10, textAlign: "right" },

  totalsBlock: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totals: { width: 260 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: { fontSize: 10, color: C.muted },
  totalsValue: { fontSize: 10, color: C.fg },
  totalsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalsTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalsTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent },

  paymentBlock: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 14,
    marginBottom: 22,
  },
  paymentRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  paymentLabel: {
    fontSize: 9.5,
    color: C.muted,
    width: 120,
  },
  paymentValue: { fontSize: 9.5, color: C.fg, flex: 1 },

  footerNote: {
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
    marginTop: 8,
  },
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

export type InvoiceData = {
  invoiceNumber: string;
  issuedAt: number;
  client: {
    name: string;
    contactName: string;
    contactRole: string | null;
  };
  lineItem: {
    description: string;
    quantity: number;
    unitPriceCents: number; // RM 3,500/pax = 350_000
  };
  subtotalCents: number;
  sstCents: number;
  totalCents: number;
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const dueAt = data.issuedAt + COMPANY.paymentTermsDays * 86_400_000;

  return (
    <Document
      title={`Tax invoice ${data.invoiceNumber} — ${data.client.name}`}
      author={COMPANY.legalName}
      creator="SalesAI"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{COMPANY.legalName}</Text>
            <Text style={styles.brandLine}>SSM: {COMPANY.ssm}</Text>
            {COMPANY.sstNumber ? (
              <Text style={styles.brandLine}>SST: {COMPANY.sstNumber}</Text>
            ) : null}
            {COMPANY.address.map((line, i) => (
              <Text key={`addr-${i}`} style={styles.brandLine}>
                {line}
              </Text>
            ))}
            <Text style={styles.brandLine}>
              {COMPANY.email} · {COMPANY.phone}
            </Text>
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Issued {formatDate(data.issuedAt)}</Text>
            <Text style={styles.invoiceMeta}>Due {formatDate(dueAt)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View>
            <Text style={styles.colHeader}>BILL TO</Text>
            <Text style={styles.colBodyBold}>{data.client.name}</Text>
            <Text style={styles.colBody}>
              {data.client.contactName}
              {data.client.contactRole ? ` · ${data.client.contactRole}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.colHeader}>PAYMENT TERMS</Text>
            <Text style={styles.colBody}>
              Net {COMPANY.paymentTermsDays} days from issue date
            </Text>
            <Text style={styles.colBody}>Due {formatDate(dueAt)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.cellUnit]}>Unit price</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellDescription}>{data.lineItem.description}</Text>
            <Text style={styles.cellQty}>{data.lineItem.quantity}</Text>
            <Text style={styles.cellUnit}>
              {formatMoneyExact(data.lineItem.unitPriceCents)}
            </Text>
            <Text style={styles.cellAmount}>
              {formatMoneyExact(data.subtotalCents)}
            </Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totals}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal (excl. SST)</Text>
              <Text style={styles.totalsValue}>
                {formatMoneyExact(data.subtotalCents)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SST 8%</Text>
              <Text style={styles.totalsValue}>
                {formatMoneyExact(data.sstCents)}
              </Text>
            </View>
            <View style={styles.totalsTotalRow}>
              <Text style={styles.totalsTotalLabel}>Total payable</Text>
              <Text style={styles.totalsTotalValue}>
                {formatMoneyExact(data.totalCents)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentBlock}>
          <Text style={styles.colHeader}>PAYMENT INSTRUCTIONS</Text>
          <View style={{ marginTop: 6 }}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Bank</Text>
              <Text style={styles.paymentValue}>{COMPANY.bank.name}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Account name</Text>
              <Text style={styles.paymentValue}>{COMPANY.bank.accountName}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Account number</Text>
              <Text style={styles.paymentValue}>{COMPANY.bank.accountNumber}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>SWIFT</Text>
              <Text style={styles.paymentValue}>{COMPANY.bank.swift}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Reference</Text>
              <Text style={styles.paymentValue}>{data.invoiceNumber}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Thank you for your business. Please reference {data.invoiceNumber} on
          your transfer.
        </Text>

        <View style={styles.footer} fixed>
          <Text>{COMPANY.legalName}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
