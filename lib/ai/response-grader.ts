"use server";

import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { chat } from "./deepseek";
import { db } from "@/db/client";
import { drillBestResponses, drills } from "@/db/schema";
import {
  DRILL_BUCKET_LABEL,
  gradeOutputSchema,
  type DrillBucket,
  type GradeOutput,
} from "@/lib/schemas/drill";
import type { Result } from "@/lib/types";

const GRADER_SYSTEM = `You are grading a sales rep's response to an
objection-handling drill scenario for a Malaysian solo founder selling 2-day
vibe-coding workshops (RM 3,500/pax + 8% SST).

Score 0-100 against the rubric AND these universal principles:
- Acknowledged the objection without sounding defensive
- Anchored back to a measurable workshop outcome (devs shipping faster, AI
  literacy uptick, internal evangelist created)
- Made the next step concrete (one ask, not five)
- Avoided over-justifying or apologetic phrasing

Be specific. Reference WHAT the rep wrote — quote a fragment if useful.
One-line feedback only. If the response is empty, score 0 and feedback
"No response written."`;

export async function gradeAndSaveDrill(args: {
  bucket: DrillBucket;
  scenarioPrompt: string;
  rubric: string[];
  repResponse: string;
}): Promise<
  Result<{
    drillId: string;
    grade: number;
    feedback: string;
    didExceedBest: boolean;
    previousBest: number | null;
  }>
> {
  const { bucket, scenarioPrompt, rubric, repResponse } = args;
  if (!repResponse.trim()) {
    return { ok: false, error: "Empty response — write something before submitting." };
  }

  const grade = await runGrader({ bucket, scenarioPrompt, rubric, repResponse });
  if (!grade.ok) return grade;

  const [existingBest] = await db
    .select()
    .from(drillBestResponses)
    .where(eq(drillBestResponses.bucket, bucket))
    .limit(1);

  const didExceedBest = !existingBest || grade.data.grade > existingBest.grade;

  const [drill] = await db
    .insert(drills)
    .values({
      bucket,
      scenarioPrompt,
      rubric,
      repResponse,
      grade: grade.data.grade,
      feedback: grade.data.feedback,
      didExceedBest,
    })
    .returning({ id: drills.id });

  if (didExceedBest && drill) {
    if (existingBest) {
      await db
        .update(drillBestResponses)
        .set({
          drillId: drill.id,
          repResponse,
          grade: grade.data.grade,
          updatedAt: Date.now(),
          // Reset callId — it gets re-bound only when delivered live.
          callId: null,
        })
        .where(eq(drillBestResponses.bucket, bucket));
    } else {
      await db.insert(drillBestResponses).values({
        bucket,
        drillId: drill.id,
        repResponse,
        grade: grade.data.grade,
      });
    }
  }

  revalidatePath("/training");
  revalidatePath("/training/drills");
  revalidatePath(`/training/drills/${bucket}`);
  revalidateTag("training-trends", "default");

  return {
    ok: true,
    data: {
      drillId: drill!.id,
      grade: grade.data.grade,
      feedback: grade.data.feedback,
      didExceedBest,
      previousBest: existingBest?.grade ?? null,
    },
  };
}

// Used by the Dry Run flow — grades a single moment without persisting it as
// a drill row. The dry-run pack is stored separately on calls.dryRun.
export async function gradeDryRunMoment(args: {
  bucket: DrillBucket;
  scenarioPrompt: string;
  rubric: string[];
  repResponse: string;
}): Promise<Result<{ grade: number; feedback: string }>> {
  if (!args.repResponse.trim()) {
    return { ok: false, error: "Empty response." };
  }
  const r = await runGrader(args);
  if (!r.ok) return r;
  return { ok: true, data: { grade: r.data.grade, feedback: r.data.feedback } };
}

async function runGrader(args: {
  bucket: DrillBucket;
  scenarioPrompt: string;
  rubric: string[];
  repResponse: string;
}): Promise<Result<GradeOutput>> {
  const { bucket, scenarioPrompt, rubric, repResponse } = args;
  try {
    const res = await generateText({
      model: chat,
      output: Output.object({ schema: gradeOutputSchema }),
      system: GRADER_SYSTEM,
      prompt: `Bucket: ${DRILL_BUCKET_LABEL[bucket]}\n\nScenario (prospect speech):\n"""${scenarioPrompt}"""\n\nRubric (what good looks like):\n${rubric.map((r) => `- ${r}`).join("\n")}\n\nRep's response:\n"""${repResponse}"""\n\nGrade now.`,
      maxOutputTokens: 400,
    });
    const parsed = gradeOutputSchema.parse(res.output);
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: `Grader failed: ${(e as Error).message}` };
  }
}
