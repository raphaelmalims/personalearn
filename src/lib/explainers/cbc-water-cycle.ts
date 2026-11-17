import { formatRagContext } from "@/lib/ai/rag";

/** One CBC topic for this spike: Science and Technology, the water cycle. */
export const WATER_CYCLE_TOPIC = "water cycle";

/**
 * Short CBC-aligned passages. The model may state only these facts.
 * They are formatted with the same context block class RAG uses.
 */
export const WATER_CYCLE_PASSAGES = [
  {
    title: "CBC Science and Technology — Evaporation",
    content:
      "The sun heats water in rivers, lakes and the sea. The water turns into water vapour and rises into the air. This change is called evaporation.",
  },
  {
    title: "CBC Science and Technology — Condensation",
    content:
      "High in the air, water vapour cools and turns into tiny water droplets. The droplets form clouds. This change is called condensation.",
  },
  {
    title: "CBC Science and Technology — Precipitation",
    content:
      "When the water droplets in a cloud become heavy, they fall as rain. Precipitation is water falling from clouds, such as rain.",
  },
  {
    title: "CBC Science and Technology — Collection",
    content:
      "Fallen water collects in rivers, lakes, the sea and the ground. The collected water can evaporate again. This movement is the water cycle.",
  },
] as const;

export function normalizeTopic(topic: string) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^the /, "");
}

export function retrieveWaterCycleContext(topic: string) {
  if (normalizeTopic(topic) !== WATER_CYCLE_TOPIC) {
    throw new Error("This spike explains one topic: the water cycle.");
  }
  return formatRagContext([...WATER_CYCLE_PASSAGES]);
}
