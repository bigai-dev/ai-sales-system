import { renderToBuffer } from "@react-pdf/renderer";
import { safeFilename } from "@/lib/format/filename";
import { ProposalPdf } from "@/lib/pdf/proposal-pdf";
import type { ProposalDoc } from "@/lib/exporters/proposal";
import { getProposalDoc } from "@/lib/queries/proposals";

export const runtime = "nodejs";
export const maxDuration = 30;

function isProposalDoc(v: unknown): v is ProposalDoc {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<ProposalDoc>;
  return (
    typeof d.client === "string" &&
    typeof d.generatedAt === "number" &&
    !!d.output &&
    !!d.pricing &&
    typeof d.pricing.cohortSize === "number"
  );
}

async function pdfResponse(doc: ProposalDoc) {
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(<ProposalPdf doc={doc} />);
  } catch (e) {
    return new Response(`PDF render failed: ${(e as Error).message}`, {
      status: 500,
    });
  }
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFilename(doc.client)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!isProposalDoc(body)) {
    return new Response("Missing or malformed proposal doc", { status: 400 });
  }
  return pdfResponse(body);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });
  const doc = await getProposalDoc(id);
  if (!doc) return new Response("Proposal not found", { status: 404 });
  return pdfResponse(doc);
}
