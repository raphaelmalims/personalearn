import { NextResponse } from "next/server";
import { z } from "zod";
import { DIAGRAM_PART_IDS, normalizeDiagramRequest } from "@/lib/diagrams/content";
import { tallyAnswers, type DiagramAnswer } from "@/lib/diagrams/tally";
import { createClient } from "@/lib/supabase/server";

const answerSchema = z.object({
  topic: z.string().min(1).max(80).optional(),
  grade: z.number().int(),
  language: z.string().min(1).max(32),
  partId: z.enum(DIAGRAM_PART_IDS),
  mode: z.enum(["find", "name"]),
  correct: z.boolean(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  return { supabase, user };
}

async function readTally(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topic: string,
  grade: number,
  language: string
) {
  const { data, error } = await supabase
    .from("diagram_answers")
    .select("part_id, mode, correct")
    .eq("topic", topic)
    .eq("grade", grade)
    .eq("language", language);
  if (error) throw new Error("Diagram tally failed.");
  const answers: DiagramAnswer[] = (data ?? []).flatMap((row) => {
    const partId = DIAGRAM_PART_IDS.find((id) => id === row.part_id);
    if (!partId || (row.mode !== "find" && row.mode !== "name")) return [];
    return [{ partId, mode: row.mode, correct: row.correct === true }];
  });
  return tallyAnswers(DIAGRAM_PART_IDS, answers);
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const url = new URL(request.url);
    const normalized = normalizeDiagramRequest({
      topic: url.searchParams.get("topic") ?? "water cycle",
      grade: Number(url.searchParams.get("grade")),
      language: url.searchParams.get("language") ?? "",
    });
    const tally = await readTally(
      supabase,
      normalized.topic,
      normalized.grade,
      normalized.language
    );
    return NextResponse.json({ tally });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Diagram tally failed";
    const status = /grade|language|water cycle/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const parsed = answerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const normalized = normalizeDiagramRequest({
      topic: parsed.data.topic ?? "water cycle",
      grade: parsed.data.grade,
      language: parsed.data.language,
    });
    const { error } = await supabase.from("diagram_answers").insert({
      topic: normalized.topic,
      grade: normalized.grade,
      language: normalized.language,
      part_id: parsed.data.partId,
      mode: parsed.data.mode,
      correct: parsed.data.correct,
    });
    if (error) {
      return NextResponse.json({ error: "Could not record that answer." }, { status: 500 });
    }
    const tally = await readTally(
      supabase,
      normalized.topic,
      normalized.grade,
      normalized.language
    );
    return NextResponse.json({ tally });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Diagram answer failed";
    const status = /grade|language|water cycle/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
