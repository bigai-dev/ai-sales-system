import { gradeRecentClosingCalls } from "@/lib/ai/grade-calls";

export const runtime = "nodejs";
export const maxDuration = 120;

// Vercel Cron hits this endpoint hourly per vercel.json.
// In production, Vercel adds the `Authorization: Bearer <CRON_SECRET>` header
// when CRON_SECRET is set in env. We accept the call either way, but if the
// secret is set we require it.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await gradeRecentClosingCalls(20);
  return Response.json(result);
}
