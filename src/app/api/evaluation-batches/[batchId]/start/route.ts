import { after, NextResponse } from "next/server";
import { emitPostHogLog, flushPostHogLogs } from "@/instrumentation";
import { requireTeacherClass } from "@/lib/auth/require-teacher-class";
import { requireTeacherEvaluationBatch } from "@/lib/evaluation/batches";
import { startOrResumeBatchProcessing } from "@/lib/evaluation/poll-batches";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

function authStatus(message: string) {
  if (message === "Not authenticated") return 401;
  if (
    message === "Class not found" ||
    message === "Evaluation batch not found"
  ) {
    return 403;
  }
  return 500;
}

/**
 * Start or resume batch processing:
 * index unindexed pages, otherwise re-submit evaluate for existing scripts.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const supabase = await createClient();
    const batch = await requireTeacherEvaluationBatch(supabase, batchId);
    await requireTeacherClass(supabase, batch.class_id);

    const service = createServiceClient();
    const { job, phase } = await startOrResumeBatchProcessing(service, batch);

    emitPostHogLog({
      body: "Evaluation batch processing started",
      severityText: "INFO",
      attributes: {
        event: "evaluation_batch_processing_started",
        processing_phase: phase,
      },
    });
    after(flushPostHogLogs);

    return NextResponse.json({ batchId, jobId: job.id, phase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = authStatus(message);
    emitPostHogLog({
      body: "Evaluation batch processing request failed",
      severityText: "ERROR",
      attributes: {
        event: "evaluation_batch_processing_failed",
        status_code: status,
      },
    });
    after(flushPostHogLogs);
    return NextResponse.json({ error: message }, { status });
  }
}
