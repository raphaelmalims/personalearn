import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { memoryExplainerCache } from "@/lib/explainers/cache";
import { requestExplainer } from "@/lib/explainers/request";

const live = process.env.EXPLAINER_MEASURE === "1";

describe.skipIf(!live)("explainer live measure", () => {
  it("reports a first fill, a full cache hit, and a personalised layer", async () => {
    const cache = memoryExplainerCache();
    const input = { topic: "water cycle", grade: 4, language: "en" };
    const emphasis = "Emphasise collection with a jerrycan at home.";
    const first = await requestExplainer(input, { cache });
    const cached = await requestExplainer(input, { cache });
    const personalised = await requestExplainer({ ...input, emphasis }, { cache });
    const full = await requestExplainer({ ...input, emphasis }, { cache });
    writeFileSync(
      "/tmp/explainer-metrics.json",
      JSON.stringify(
        {
          first: { cache: first.cache, base: first.base, personal: first.personal, metrics: first.metrics },
          cached: {
            cache: cached.cache,
            base: cached.base,
            personal: cached.personal,
            metrics: cached.metrics,
          },
          personalised: {
            cache: personalised.cache,
            base: personalised.base,
            personal: personalised.personal,
            metrics: personalised.metrics,
          },
          full: { cache: full.cache, base: full.base, personal: full.personal, metrics: full.metrics },
        },
        null,
        2
      )
    );
    expect(first.cache).toBe("miss");
    expect(cached.cache).toBe("hit");
    expect(cached.metrics.promptTokens).toBe(0);
    expect(cached.metrics.costUsd).toBe(0);
    expect(cached.script).toEqual(first.script);
    expect(personalised.cache).toBe("personalised");
    expect(personalised.base).toBe("hit");
    expect(full.cache).toBe("hit");
    expect(full.metrics.promptTokens).toBe(0);
    expect(full.metrics.costUsd).toBe(0);
  }, 90_000);
});
