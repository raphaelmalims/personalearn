import { generateImage, generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGeminiFlashModel, getImageGenerationModel } from "@/lib/ai/vision-model";
import type { VisualSpec } from "@/lib/explainers/blocks";
import { canonicalTopic } from "@/lib/explainers/topic-context";

/** Gemini 2.5 Flash Image, one image up to 1024px. https://ai.google.dev/gemini-api/docs/pricing */
export const SCENE_IMAGE_USD = 0.039;
const DEFAULT_DAILY_CAP = 12;

export class SceneQuotaError extends Error {
  constructor() {
    super("Scene picture quota");
    this.name = "SceneQuotaError";
  }
}

export class ScenePictureError extends Error {
  constructor() {
    super("Scene picture failed");
    this.name = "ScenePictureError";
  }
}

export type ScenePoint = { id: string; x: number; y: number };

export type ScenePipeline = {
  takeCap: () => Promise<"ok" | "capped">;
  illustrate: (prompt: string) => Promise<{
    bytes: Uint8Array;
    mediaType: string;
    modelId: string;
    costUsd: number;
  }>;
  locate: (input: {
    bytes: Uint8Array;
    mediaType: string;
    parts: { id: string; label: string }[];
  }) => Promise<ScenePoint[]>;
  store: (path: string, bytes: Uint8Array, mediaType: string) => Promise<void>;
};

type SceneSpec = Extract<VisualSpec, { block: "scene" }>;

export function sceneDailyCap() {
  const raw = Number(process.env.SCENE_IMAGE_DAILY_CAP);
  if (Number.isInteger(raw) && raw >= 1 && raw <= 100) return raw;
  return DEFAULT_DAILY_CAP;
}

export function sceneObjectPath(input: { topic: string; grade: number; language: string }) {
  const slug = canonicalTopic(input.topic).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "topic";
  return `scenes/${input.grade}/${input.language}/${slug}.png`;
}

export function isSceneObjectPath(path: string) {
  return /^scenes\/[1-9]\/(?:en|sw)\/[a-z0-9-]{1,80}\.png$/.test(path);
}

export function illustrationPrompt(spec: SceneSpec, grade: number) {
  const parts = spec.parts
    .map((part) => `- ${part.label}: ${part.explanation}`)
    .join("\n");
  return [
    `A teaching illustration for grade ${grade}, drawn so the labels stay readable on a phone.`,
    `Title: ${spec.title}.`,
    "Draw every label and every arrow on the picture. Use short words, large high-contrast type, and clear arrowheads.",
    "Plain background. No watermark, no paragraph, no extra labels.",
    "Parts:",
    parts,
  ].join("\n");
}

/** Keep a point only when every part is on the picture and separated from the others. */
export function acceptPartLocations(ids: string[], located: ScenePoint[]): ScenePoint[] | null {
  if (located.length !== ids.length) return null;
  const byId = new Map(located.map((point) => [point.id, point]));
  if (byId.size !== ids.length) return null;
  const points: ScenePoint[] = [];
  for (const id of ids) {
    const point = byId.get(id);
    if (!point) return null;
    if (point.x < 4 || point.x > 96 || point.y < 4 || point.y > 96) return null;
    points.push({ id, x: point.x, y: point.y });
  }
  for (let left = 0; left < points.length; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      const dx = points[left]!.x - points[right]!.x;
      const dy = points[left]!.y - points[right]!.y;
      if (Math.hypot(dx, dy) < 8) return null;
    }
  }
  return points;
}

export function memorySceneCap(limit = DEFAULT_DAILY_CAP): Pick<ScenePipeline, "takeCap"> {
  let count = 0;
  return {
    async takeCap() {
      if (count >= limit) return "capped";
      count += 1;
      return "ok";
    },
  };
}

function utcDay(at = new Date()) {
  return at.toISOString().slice(0, 10);
}

function quotaMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /quota|rate.?limit|RESOURCE_EXHAUSTED|billing/i.test(message);
}

export function scenePipeline(supabase: SupabaseClient, at = new Date()): ScenePipeline {
  const day = utcDay(at);
  const limit = sceneDailyCap();
  return {
    async takeCap() {
      const key = `visual|scene-cap|${day}`;
      const { data } = await supabase
        .from("explainer_cache")
        .select("script")
        .eq("cache_key", key)
        .maybeSingle();
      const count = Number((data?.script as { count?: unknown } | null)?.count ?? 0);
      if (count >= limit) return "capped";
      const { error } = await supabase.from("explainer_cache").upsert({
        cache_key: key,
        script: { count: count + 1 },
        model_id: "scene-cap",
      });
      if (error) throw new ScenePictureError();
      return "ok";
    },
    async illustrate(prompt) {
      try {
        const started = performance.now();
        const { image } = await generateImage({
          model: getImageGenerationModel(),
          prompt,
        });
        const wall = Math.round(performance.now() - started);
        console.info(
          JSON.stringify({
            event: "scene_image",
            modelId: "gemini-2.5-flash-image",
            costUsd: SCENE_IMAGE_USD,
            wallTimeMs: wall,
          })
        );
        return {
          bytes: image.uint8Array,
          mediaType: image.mediaType || "image/png",
          modelId: "gemini-2.5-flash-image",
          costUsd: SCENE_IMAGE_USD,
        };
      } catch (error) {
        if (quotaMessage(error)) throw new SceneQuotaError();
        throw new ScenePictureError();
      }
    },
    async locate(input) {
      const listed = input.parts.map((part) => `${part.id}=${part.label}`).join(", ");
      try {
        const result = await generateText({
          model: getGeminiFlashModel(),
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `The picture has these labelled parts: ${listed}. Return JSON only, an array of {"id","x","y"}. x and y are 0 to 100, the centre of that part on the picture. Use only the listed ids.`,
                },
                { type: "image", image: input.bytes, mediaType: input.mediaType },
              ],
            },
          ],
        });
        return parsePoints(result.text);
      } catch (error) {
        if (quotaMessage(error)) throw new SceneQuotaError();
        throw new ScenePictureError();
      }
    },
    async store(path, bytes, mediaType) {
      if (!isSceneObjectPath(path)) throw new ScenePictureError();
      const { error } = await supabase.storage.from("explainers").upload(path, bytes, {
        contentType: mediaType,
        upsert: true,
      });
      if (error) throw new ScenePictureError();
    },
  };
}

function parsePoints(text: string): ScenePoint[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) throw new ScenePictureError();
  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new ScenePictureError();
  }
  if (!Array.isArray(json)) throw new ScenePictureError();
  return json.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; x?: unknown; y?: unknown };
    if (typeof row.id !== "string" || typeof row.x !== "number" || typeof row.y !== "number") return [];
    return [{ id: row.id, x: row.x, y: row.y }];
  });
}

export function applyScenePicture(
  spec: SceneSpec,
  points: ScenePoint[],
  imagePath: string
): SceneSpec {
  const accepted = acceptPartLocations(
    spec.parts.map((part) => part.id),
    points
  );
  if (!accepted || !isSceneObjectPath(imagePath)) throw new ScenePictureError();
  const byId = new Map(accepted.map((point) => [point.id, point]));
  return {
    ...spec,
    imagePath,
    parts: spec.parts.map((part) => {
      const point = byId.get(part.id)!;
      return { ...part, x: point.x, y: point.y };
    }),
  };
}
