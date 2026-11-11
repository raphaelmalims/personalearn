import {
  DIAGRAM_PART_IDS,
  type DiagramContent,
  type DiagramPart,
  type DiagramPartId,
} from "@/lib/diagrams/content";
import { canonicalTopic } from "@/lib/explainers/topic-context";
import type { VisualSpec } from "@/lib/explainers/blocks";

const HINTS: Record<DiagramPartId, RegExp> = {
  evaporation: /evapor|vapou|vapor|\bsun\b/,
  condensation: /condens|cloud/,
  precipitation: /precip|\brain\b/,
  collection: /collect|lake|river|\bsea\b|ground/,
};

const DEFAULTS: Record<DiagramPartId, Omit<DiagramPart, "id">> = {
  evaporation: {
    label: "Evaporation",
    explanation: "The sun heats water until it rises as vapour.",
    prompt: "Tap where water rises as vapour.",
  },
  condensation: {
    label: "Condensation",
    explanation: "Water vapour cools and forms clouds.",
    prompt: "Tap where clouds form.",
  },
  precipitation: {
    label: "Precipitation",
    explanation: "Heavy drops fall as rain.",
    prompt: "Tap where rain falls.",
  },
  collection: {
    label: "Collection",
    explanation: "Fallen water gathers in rivers, lakes and the sea.",
    prompt: "Tap where water gathers.",
  },
};

type LoosePart = { id: string; label: string; explanation: string; prompt: string };

export function toWaterCycleDiagram(
  topic: string,
  spec: VisualSpec
): DiagramContent | null {
  if (spec.block !== "labelled-diagram") return null;
  if (canonicalTopic(topic) !== "water cycle") return null;

  const assigned = new Map<DiagramPartId, LoosePart>();
  const used = new Set<LoosePart>();
  for (const part of spec.parts) {
    const blob = `${part.id} ${part.label} ${part.explanation}`.toLowerCase();
    const id = DIAGRAM_PART_IDS.find((candidate) => !assigned.has(candidate) && HINTS[candidate].test(blob));
    if (!id) continue;
    assigned.set(id, part);
    used.add(part);
  }
  const leftovers = spec.parts.filter((part) => !used.has(part));
  for (const id of DIAGRAM_PART_IDS) {
    if (assigned.has(id)) continue;
    const next = leftovers.shift();
    if (next) assigned.set(id, next);
  }

  return {
    title: spec.title,
    parts: DIAGRAM_PART_IDS.map((id) => {
      const part = assigned.get(id);
      const fallback = DEFAULTS[id];
      return {
        id,
        label: part?.label || fallback.label,
        explanation: part?.explanation || fallback.explanation,
        prompt: part?.prompt || fallback.prompt,
      };
    }),
  };
}
