import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseExplainerCache } from "@/lib/explainers/cache";
import { requestExplainer } from "@/lib/explainers/request";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  topic: z.string().min(1).max(80).optional(),
  grade: z.number().int(),
  language: z.string().min(1).max(32),
  emphasis: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = await requestExplainer(
      {
        topic: parsed.data.topic ?? "water cycle",
        grade: parsed.data.grade,
        language: parsed.data.language,
        emphasis: parsed.data.emphasis,
      },
      { cache: supabaseExplainerCache(supabase) }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Explainer failed";
    const status = /grade|language|water cycle|script/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
