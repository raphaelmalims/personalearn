import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composerEnterAction,
  isImeComposing,
  pointerIsCoarse,
} from "@/lib/ai-hub/composer-enter";

describe("composerEnterAction", () => {
  it("sends on Enter for a fine pointer and inserts a newline on Shift+Enter", () => {
    expect(
      composerEnterAction({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        coarsePointer: false,
      })
    ).toBe("send");
    expect(
      composerEnterAction({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
        coarsePointer: false,
      })
    ).toBe("newline");
  });

  it("inserts a newline on Enter for a coarse pointer", () => {
    expect(
      composerEnterAction({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        coarsePointer: true,
      })
    ).toBe("newline");
  });

  it("never sends while IME composition is active", () => {
    expect(
      composerEnterAction({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
        coarsePointer: false,
      })
    ).toBe("ignore");
    expect(
      composerEnterAction({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
        coarsePointer: true,
      })
    ).toBe("ignore");
  });

  it("ignores keys other than Enter", () => {
    expect(
      composerEnterAction({
        key: "a",
        shiftKey: false,
        isComposing: false,
        coarsePointer: false,
      })
    ).toBe("ignore");
  });
});

describe("isImeComposing", () => {
  it("treats keyCode 229 as composition", () => {
    expect(isImeComposing({ keyCode: 229 })).toBe(true);
    expect(isImeComposing({ isComposing: true })).toBe(true);
    expect(isImeComposing({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});

describe("pointerIsCoarse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the coarse-pointer media query", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query === "(pointer: coarse)",
      }),
    });
    expect(pointerIsCoarse()).toBe(true);
  });
});
