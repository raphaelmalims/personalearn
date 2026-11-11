import { z } from "zod";
import type { ExplainerCacheStatus, ExplainerMetrics } from "@/lib/explainers/script";

export const VISUAL_BLOCKS = [
  "process-flow",
  "labelled-diagram",
  "number-line",
  "comparison",
  "timeline",
] as const;

export type VisualBlock = (typeof VISUAL_BLOCKS)[number];

export const NO_BLOCK_LINE = "No visual block fits this topic.";

const quizSchema = z.object({
  prompt: z.string().trim().min(1).max(140),
  answer: z.string().trim().min(1).max(80),
});

const processSchema = z.object({
  block: z.literal("process-flow"),
  title: z.string().trim().min(1).max(80),
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        caption: z.string().trim().min(1).max(140),
      })
    )
    .min(3)
    .max(4),
  quiz: quizSchema,
});

const diagramSchema = z.object({
  block: z.literal("labelled-diagram"),
  title: z.string().trim().min(1).max(80),
  parts: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[a-z0-9-]{2,32}$/),
        label: z.string().trim().min(1).max(40),
        explanation: z.string().trim().min(1).max(160),
        prompt: z.string().trim().min(1).max(120),
      })
    )
    .min(2)
    .max(4),
  quiz: quizSchema,
});

const numberLineSchema = z.object({
  block: z.literal("number-line"),
  title: z.string().trim().min(1).max(80),
  min: z.number().int().min(-50).max(50),
  max: z.number().int().min(-50).max(50),
  points: z
    .array(
      z.object({
        value: z.number().int().min(-50).max(50),
        label: z.string().trim().min(1).max(24),
        caption: z.string().trim().min(1).max(140),
      })
    )
    .min(3)
    .max(5),
  quiz: quizSchema,
});

const comparisonSchema = z.object({
  block: z.literal("comparison"),
  title: z.string().trim().min(1).max(80),
  columns: z.tuple([z.string().trim().min(1).max(40), z.string().trim().min(1).max(40)]),
  rows: z
    .array(
      z.object({
        cells: z.tuple([z.string().trim().min(1).max(80), z.string().trim().min(1).max(80)]),
      })
    )
    .min(2)
    .max(4),
  captions: z.array(z.string().trim().min(1).max(140)).min(2).max(4),
  quiz: quizSchema,
});

const timelineSchema = z.object({
  block: z.literal("timeline"),
  title: z.string().trim().min(1).max(80),
  events: z
    .array(
      z.object({
        when: z.string().trim().min(1).max(40),
        label: z.string().trim().min(1).max(40),
        caption: z.string().trim().min(1).max(140),
      })
    )
    .min(3)
    .max(4),
  quiz: quizSchema,
});

export const visualSpecSchema = z.discriminatedUnion("block", [
  processSchema,
  diagramSchema,
  numberLineSchema,
  comparisonSchema,
  timelineSchema,
]);

export type VisualSpec = z.infer<typeof visualSpecSchema>;

export type VisualArtifact = {
  fit: true;
  block: VisualBlock;
  topic: string;
  grade: number;
  language: string;
  spec: VisualSpec;
  cache: ExplainerCacheStatus;
  metrics: ExplainerMetrics;
};

export type VisualFallback = {
  fit: false;
  line: string;
};

export function isVisualBlock(value: string): value is VisualBlock {
  return (VISUAL_BLOCKS as readonly string[]).includes(value);
}

export function visualCaptions(spec: VisualSpec) {
  switch (spec.block) {
    case "process-flow":
      return spec.steps.map((step) => step.caption);
    case "number-line":
      return spec.points.map((point) => point.caption);
    case "labelled-diagram":
      return spec.parts.map((part) => `${part.label}. ${part.explanation}`);
    case "comparison":
      return spec.captions;
    case "timeline":
      return spec.events.map((event) => event.caption);
  }
}

export function parseVisualSpec(text: string, block?: VisualBlock): VisualSpec {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Visual spec was not JSON.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error("Visual spec was not JSON.");
  }
  return visualSpecFromUnknown(json, block);
}

export function visualSpecFromUnknown(value: unknown, block?: VisualBlock): VisualSpec {
  const parsed = visualSpecSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Visual spec did not match the block.");
  }
  if (block && parsed.data.block !== block) {
    throw new Error("Visual spec did not match the block.");
  }
  if (parsed.data.block === "labelled-diagram") {
    const ids = parsed.data.parts.map((part) => part.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("Visual spec did not match the block.");
    }
  }
  if (parsed.data.block === "number-line") {
    const spec = parsed.data;
    const values = spec.points.map((point) => point.value);
    const offLine = spec.points.some((point) => point.value < spec.min || point.value > spec.max);
    if (spec.min >= spec.max || new Set(values).size !== values.length || offLine) {
      throw new Error("Visual spec did not match the block.");
    }
  }
  return parsed.data;
}

export function isVisualArtifact(value: unknown): value is VisualArtifact {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.fit !== true || typeof record.block !== "string" || !isVisualBlock(record.block)) {
    return false;
  }
  try {
    const spec = visualSpecFromUnknown(record.spec, record.block);
    return spec.block === record.block;
  } catch {
    return false;
  }
}

export function isVisualFallback(value: unknown): value is VisualFallback {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.fit === false && typeof record.line === "string" && record.line.trim().length > 0;
}
