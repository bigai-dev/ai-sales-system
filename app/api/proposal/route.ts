import { generateProposalCore } from "@/lib/ai/proposal-core";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { clientId?: unknown }).clientId !== "string"
  ) {
    return Response.json({ ok: false, error: "Missing clientId" }, { status: 400 });
  }
  const { clientId } = body as { clientId: string };

  const result = await generateProposalCore(clientId, req.signal);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
