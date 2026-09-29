import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createSceneState,
  DOCUMENT_WRAP,
  resolveSceneTier,
  sceneBudget,
  shouldRunScene,
  stepScene,
} from "./scene-model";

describe("resolveSceneTier", () => {
  it("uses the lighter tier for coarse pointers and narrow viewports", () => {
    expect(
      resolveSceneTier({
        viewportWidth: 1280,
        coarsePointer: true,
        cores: 8,
        deviceMemory: 8,
      })
    ).toBe("mobile");
    expect(
      resolveSceneTier({
        viewportWidth: 390,
        coarsePointer: false,
        cores: 8,
        deviceMemory: 8,
      })
    ).toBe("mobile");
  });

  it("drops a desktop with few cores or little memory to the modest tier", () => {
    expect(
      resolveSceneTier({
        viewportWidth: 1280,
        coarsePointer: false,
        cores: 4,
        deviceMemory: 8,
      })
    ).toBe("modest");
    expect(
      resolveSceneTier({
        viewportWidth: 1440,
        coarsePointer: false,
        cores: 8,
        deviceMemory: 4,
      })
    ).toBe("modest");
  });

  it("keeps a capable desktop on the full tier", () => {
    expect(
      resolveSceneTier({
        viewportWidth: 1440,
        coarsePointer: false,
        cores: 8,
        deviceMemory: 8,
      })
    ).toBe("full");
  });
});

describe("sceneBudget", () => {
  it("scales nodes down for mobile and skips neighbour links", () => {
    const mobile = sceneBudget("mobile");
    const full = sceneBudget("full");
    expect(mobile.nodes).toBeLessThan(full.nodes);
    expect(mobile.neighborLinks).toBe(false);
    expect(full.neighborLinks).toBe(true);
    expect(mobile.dprCap).toBeLessThan(full.dprCap);
    expect(mobile.documents).toBe(3);
  });
});

describe("shouldRunScene", () => {
  it("pauses off-screen, on a hidden tab, and for reduced motion", () => {
    expect(
      shouldRunScene({ inView: true, tabVisible: true, reducedMotion: false })
    ).toBe(true);
    expect(
      shouldRunScene({ inView: false, tabVisible: true, reducedMotion: false })
    ).toBe(false);
    expect(
      shouldRunScene({ inView: true, tabVisible: false, reducedMotion: false })
    ).toBe(false);
    expect(
      shouldRunScene({ inView: true, tabVisible: true, reducedMotion: true })
    ).toBe(false);
  });
});

describe("scene cycle", () => {
  it("places one of each document and wraps them back to the edge", () => {
    const state = createSceneState(sceneBudget("full"), 7);
    expect(state.nodes).toHaveLength(42);
    expect(state.documents.map((doc) => doc.kind)).toEqual([
      "scheme",
      "paper",
      "script",
    ]);
    state.documents[0].progress = DOCUMENT_WRAP - 0.01;
    state.documents[0].speed = 1;
    stepScene(state, 0.02);
    expect(state.documents[0].progress).toBeLessThan(0.2);
    expect(state.time).toBeGreaterThan(0);
  });
});

describe("hero chunk budget", () => {
  it("keeps the scene sources under 100KB gzipped before the client chunk is split", () => {
    const dir = path.join(process.cwd(), "src/components/landing");
    const source = ["scene-model.ts", "landing-scene.tsx"]
      .map((name) => readFileSync(path.join(dir, name)))
      .reduce((acc, buf) => Buffer.concat([acc, buf]));
    expect(gzipSync(source).length).toBeLessThan(100_000);
  });
});
