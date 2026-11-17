import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bundledTopicContext } from "@/lib/explainers/topic-context";
import { memoryVisualCache } from "@/lib/explainers/visual-cache";
import { requestVisual } from "@/lib/explainers/visual";

const live = process.env.VISUAL_MEASURE === "1";

describe.skipIf(!live)("visual live measure", () => {
  it("reports first and cached fills for integers and the water cycle", async () => {
    const cache = memoryVisualCache();
    async function pair(
      block: "number-line" | "process-flow",
      topic: string,
      grade: number
    ) {
      const input = {
        block,
        topic,
        grade,
        language: "en",
        context: bundledTopicContext(topic),
      };
      const first = await requestVisual(input, { cache });
      const cached = await requestVisual(input, { cache });
      return {
        first: first.fit ? { cache: first.cache, metrics: first.metrics, title: first.spec.title } : first,
        cached: cached.fit
          ? { cache: cached.cache, metrics: cached.metrics, title: cached.spec.title }
          : cached,
      };
    }

    const integers = await pair("number-line", "Introduction to Integers", 7);
    const water = await pair("process-flow", "water cycle", 4);
    writeFileSync(
      "/tmp/visual-metrics.json",
      JSON.stringify({ integers, water }, null, 2)
    );
    expect(integers.first).toMatchObject({ cache: "miss" });
    expect(integers.cached).toMatchObject({ cache: "hit" });
    expect(water.first).toMatchObject({ cache: "miss" });
    expect(water.cached).toMatchObject({ cache: "hit" });
  }, 90_000);
});
