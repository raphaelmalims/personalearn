import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { pollPendingBatchJobs } from "@/lib/evaluation/poll-batches";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Poll eval Batch jobs (xAI or Gemini); advance index → evaluate phases. */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, anonKey } = getSupabaseEnv();
    const anon = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: probe, error: probeError } = await anon.rpc(
      "eval_batch_poll_probe"
    );
    if (probeError) throw new Error(probeError.message);

    const pending = Number(
      (probe as { pending?: number } | null)?.pending ?? 0
    );
    if (pending === 0) {
      return NextResponse.json({ ok: true, processed: 0, keepAlive: probe });
    }

    const supabase = createServiceClient();
    const processed = await pollPendingBatchJobs(supabase);
    return NextResponse.json({ ok: true, processed, keepAlive: probe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
