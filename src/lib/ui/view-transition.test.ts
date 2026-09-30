import { describe, expect, it, vi } from "vitest";
import { runViewTransition } from "./view-transition";

describe("runViewTransition", () => {
  it("runs the update immediately when View Transitions are unavailable", () => {
    const update = vi.fn();
    runViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
