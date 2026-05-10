import { renderToBuffer } from "@react-pdf/renderer";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { clients, deals, proposals } from "@/db/schema";
import { sstSen } from "@/db/lib/money";
import { InvoicePdf, type InvoiceData } from "@/lib/pdf/invoice-pdf";
import { nextInvoiceNumber } from "@/lib/invoice/numbering";

export const runtime = "nodejs";
export const maxDuration = 30;

const PER_PAX_SEN = 350_000; // RM 3,500

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "_").replace(/^_|_$/g, "") || "invoice";
}

async function resolveCohortSize(
  dealId: string,
  clientId: string,
  dealHeadcount: number | null,
  dealValueCents: number,
): Promise<number> {
  // Prefer the latest proposal's cohort size for this client (most accurate).
  const [latest] = await db
    .select({ cohortSize: proposals.cohortSize })
    .from(proposals)
    .where(eq(proposals.clientId, clientId))
    .orderBy(desc(proposals.generatedAt))
    .limit(1);
  if (latest?.cohortSize) return latest.cohortSize;
  if (dealHeadcount && dealHeadcount > 0) return dealHeadcount;
  // Fall back to dividing the deal value by per-pax price.
  if (dealValueCents > 0) {
    return Math.max(1, Math.round(dealValueCents / PER_PAX_SEN));
  }
  return 1;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  if (!dealId) return new Response("Missing dealId", { status: 400 });

  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
  if (!deal) return new Response("Deal not found", { status: 404 });
  if (deal.stage !== "O") {
    return new Response(
      "Invoice can only be issued for deals in stage O (Order)",
      { status: 400 },
    );
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, deal.clientId));
  if (!client) return new Response("Client not found", { status: 404 });

  // Issue an invoice number on first generation; reuse it forever after.
  let invoiceNumber = deal.invoiceNumber;
  let issuedAt = deal.invoiceIssuedAt;
  if (!invoiceNumber || !issuedAt) {
    invoiceNumber = await nextInvoiceNumber();
    issuedAt = Date.now();
    await db
      .update(deals)
      .set({ invoiceNumber, invoiceIssuedAt: issuedAt })
      .where(eq(deals.id, deal.id));
    revalidatePath(`/clients/${deal.clientId}`);
  }

  const cohortSize = await resolveCohortSize(
    deal.id,
    deal.clientId,
    deal.headcount,
    deal.valueCents,
  );
  const subtotalCents = cohortSize * PER_PAX_SEN;
  const sst = sstSen(subtotalCents);

  const data: InvoiceData = {
    invoiceNumber,
    issuedAt,
    client: {
      name: client.name,
      contactName: client.contactName,
      contactRole: client.contactRole,
    },
    lineItem: {
      description: `2-day vibe-coding workshop · ${cohortSize} pax`,
      quantity: cohortSize,
      unitPriceCents: PER_PAX_SEN,
    },
    subtotalCents,
    sstCents: sst,
    totalCents: subtotalCents + sst,
  };

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(<InvoicePdf data={data} />);
  } catch (e) {
    return new Response(`PDF render failed: ${(e as Error).message}`, {
      status: 500,
    });
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFilename(invoiceNumber)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
