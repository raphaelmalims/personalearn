import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { memoryDiagramCache } from "@/lib/diagrams/cache";
import { requestDiagram } from "@/lib/diagrams/request";

const live = process.env.DIAGRAM_MEASURE === "1";

describe.skipIf(!live)("diagram live measure", () => {
  it("reports a first fill and a cached repeat", async () => {
    const cache = memoryDiagramCache();
    const input = { topic: "water cycle", grade: 4, language: "en" };
    const first = await requestDiagram(input, { cache });
    const cached = await requestDiagram(input, { cache });
    writeFileSync(
      "/tmp/diagram-metrics.json",
      JSON.stringify(
        {
          first: { cache: first.cache, metrics: first.metrics },
          cached: { cache: cached.cache, metrics: cached.metrics },
        },
        null,
        2
      )
    );
    expect(first.cache).toBe("miss");
    expect(first.metrics.promptTokens).toBeGreaterThan(0);
    expect(cached.cache).toBe("hit");
    expect(cached.metrics.promptTokens).toBe(0);
    expect(cached.metrics.costUsd).toBe(0);
    expect(cached.content).toEqual(first.content);
  }, 60_000);
});
