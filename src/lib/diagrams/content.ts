import { z } from "zod";
import { normalizeTopic, WATER_CYCLE_TOPIC } from "@/lib/explainers/cbc-water-cycle";
import {
  normalizeGrade,
  normalizeLanguage,
  type ExplainerMetrics,
} from "@/lib/explainers/script";

/** Fixed hit regions on the water-cycle diagram. The model fills text only. */
export const DIAGRAM_PART_IDS = [
  "evaporation",
  "condensation",
  "precipitation",
  "collection",
] as const;

export type DiagramPartId = (typeof DIAGRAM_PART_IDS)[number];

const partSchema = z.object({
  id: z.enum(DIAGRAM_PART_IDS),
  label: z.string().trim().min(1).max(40),
  explanation: z.string().trim().min(1).max(180),
  prompt: z.string().trim().min(1).max(120),
});

const contentSchema = z.object({
  title: z.string().trim().min(1).max(80),
  parts: z.array(partSchema).length(DIAGRAM_PART_IDS.length),
});

export type DiagramPart = z.infer<typeof partSchema>;

export type DiagramContent = z.infer<typeof contentSchema>;

export type DiagramMetrics = ExplainerMetrics;

export type DiagramResult = {
  cache: "hit" | "miss";
  topic: string;
  grade: number;
  language: string;
  content: DiagramContent;
  metrics: DiagramMetrics;
};

export function diagramCacheKey(input: {
  topic: string;
  grade: number;
  language: string;
}) {
  return `diagram|${normalizeTopic(input.topic)}|${normalizeGrade(input.grade)}|${normalizeLanguage(input.language)}`;
}

export function assertWaterCycleTopic(topic: string) {
  const normalized = normalizeTopic(topic);
  if (normalized !== WATER_CYCLE_TOPIC) {
    throw new Error("This spike diagrams one topic: the water cycle.");
  }
  return normalized;
}

export function normalizeDiagramRequest(input: {
  topic: string;
  grade: number;
  language: string;
}) {
  return {
    topic: assertWaterCycleTopic(input.topic),
    grade: normalizeGrade(input.grade),
    language: normalizeLanguage(input.language),
  };
}

export function parseDiagramContent(text: string): DiagramContent {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Diagram content was not JSON.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error("Diagram content was not JSON.");
  }
  const parsed = contentSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Diagram content did not match the template.");
  }
  const ids = parsed.data.parts.map((part) => part.id);
  if (new Set(ids).size !== DIAGRAM_PART_IDS.length) {
    throw new Error("Diagram content did not match the template.");
  }
  return {
    title: parsed.data.title,
    parts: DIAGRAM_PART_IDS.map(
      (id) => parsed.data.parts.find((part) => part.id === id)!
    ),
  };
}

export const SAMPLE_DIAGRAM: DiagramContent = {
  title: "The water cycle",
  parts: [
    {
      id: "evaporation",
      label: "Evaporation",
      explanation: "The sun heats water until it rises as vapour.",
      prompt: "Tap where the sun turns water into vapour.",
    },
    {
      id: "condensation",
      label: "Condensation",
      explanation: "Vapour cools high up and forms a cloud.",
      prompt: "Tap where vapour cools and forms a cloud.",
    },
    {
      id: "precipitation",
      label: "Precipitation",
      explanation: "Heavy droplets fall from the cloud as rain.",
      prompt: "Tap where water falls from the cloud.",
    },
    {
      id: "collection",
      label: "Collection",
      explanation: "Rain collects in the lake and can rise again.",
      prompt: "Tap where fallen water collects.",
    },
  ],
};
