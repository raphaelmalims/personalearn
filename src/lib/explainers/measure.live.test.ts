import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getExplainerCache, requestExplainer } from "@/lib/explainers/request";

const live = process.env.EXPLAINER_MEASURE === "1";

describe.skipIf(!live)("explainer live measure", () => {
  it("reports an uncached fill and a cached repeat", async () => {
    getExplainerCache().clear();
    const input = { topic: "water cycle", grade: 4, language: "en" };
    const first = await requestExplainer(input);
    const second = await requestExplainer(input);
    writeFileSync(
      "/tmp/explainer-metrics.json",
      JSON.stringify(
        {
          first: { cache: first.cache, metrics: first.metrics, script: first.script },
          second: { cache: second.cache, metrics: second.metrics },
        },
        null,
        2
      )
    );
    expect(first.cache).toBe("miss");
    expect(second.cache).toBe("hit");
    expect(second.metrics.promptTokens).toBe(0);
    expect(second.metrics.costUsd).toBe(0);
    expect(second.script).toEqual(first.script);
  }, 60_000);
});
