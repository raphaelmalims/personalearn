import { describe, expect, it } from "vitest";
import { duration, presets, staggerStep } from "@/lib/motion";

describe("motion tokens", () => {
  it("keeps durations aligned with motion.css milliseconds", () => {
    expect(duration.instant * 1000).toBe(80);
    expect(duration.fast * 1000).toBe(150);
    expect(duration.base * 1000).toBe(240);
    expect(duration.slow * 1000).toBe(400);
    expect(duration.slower * 1000).toBe(700);
  });

  it("staggers list items from the shared step", () => {
    const first = presets.listItem(0).transition;
    const third = presets.listItem(2).transition;
    expect(staggerStep).toBe(0.04);
    expect(first.delay).toBe(0);
    expect(third.delay).toBe(0.08);
  });

  it("uses a crossfade for reduced-motion press instead of a scale", () => {
    expect(presets.pressReduced.whileTap).toEqual({ opacity: 0.82 });
    expect(presets.press.whileTap).toEqual({ scale: 0.98 });
  });
});
