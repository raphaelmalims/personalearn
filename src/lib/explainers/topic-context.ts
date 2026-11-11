import { formatRagContext } from "@/lib/ai/rag";
import { normalizeTopic, retrieveWaterCycleContext } from "@/lib/explainers/cbc-water-cycle";

const INTEGER_PASSAGES = [
  {
    title: "CBC Mathematics — Integers",
    content:
      "Integers are whole numbers that can be negative, zero, or positive. Examples are -3, 0, and 2.",
  },
  {
    title: "CBC Mathematics — The number line",
    content:
      "A number line shows integers in order. Numbers increase to the right. Zero sits between the negative integers and the positive integers.",
  },
  {
    title: "CBC Mathematics — Less and greater",
    content:
      "A negative integer is less than zero. A positive integer is greater than zero. -3 is to the left of -1, so -3 is less than -1.",
  },
] as const;

export function canonicalTopic(topic: string) {
  const normalized = normalizeTopic(topic);
  if (normalized.includes("integer")) return "introduction to integers";
  if (normalized.includes("water cycle")) return "water cycle";
  return normalized;
}

export function bundledTopicContext(topic: string) {
  const canonical = canonicalTopic(topic);
  if (canonical === "water cycle") return retrieveWaterCycleContext(canonical);
  if (canonical === "introduction to integers") {
    return formatRagContext([...INTEGER_PASSAGES]);
  }
  return null;
}
