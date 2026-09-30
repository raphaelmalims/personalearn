import { describe, expect, it } from "vitest";
import {
  isKeyboardOpen,
  KEYBOARD_OPEN_INSET_PX,
  mobileComposerMotionClass,
  MOBILE_COMPOSER_NEAR_BOTTOM_PX,
  MOBILE_COMPOSER_SCROLL_PX,
  nextMobileComposerHidden,
} from "@/lib/ai-hub/mobile-composer-visibility";

const reading = {
  delta: 0,
  accumulatedDelta: 0,
  distanceFromBottom: 480,
  composerFocused: false,
  keyboardOpen: false,
  hidden: false,
};

describe("nextMobileComposerHidden", () => {
  it("hides after an upward scroll through older messages", () => {
    const step = nextMobileComposerHidden({
      ...reading,
      delta: -(MOBILE_COMPOSER_SCROLL_PX - 1),
    });
    expect(step.hidden).toBe(false);

    expect(
      nextMobileComposerHidden({
        ...reading,
        delta: -1,
        accumulatedDelta: step.accumulatedDelta,
      }).hidden
    ).toBe(true);
  });

  it("shows again when the teacher scrolls down", () => {
    expect(
      nextMobileComposerHidden({
        ...reading,
        hidden: true,
        delta: MOBILE_COMPOSER_SCROLL_PX,
      }).hidden
    ).toBe(false);
  });

  it("stays visible while the composer is focused", () => {
    expect(
      nextMobileComposerHidden({
        ...reading,
        composerFocused: true,
        hidden: true,
        delta: -40,
      })
    ).toEqual({ hidden: false, accumulatedDelta: 0 });
  });

  it("stays visible while the keyboard is open", () => {
    expect(
      nextMobileComposerHidden({
        ...reading,
        keyboardOpen: true,
        hidden: true,
        delta: -40,
      }).hidden
    ).toBe(false);
  });

  it("stays visible when the latest messages are still on screen", () => {
    expect(
      nextMobileComposerHidden({
        ...reading,
        distanceFromBottom: MOBILE_COMPOSER_NEAR_BOTTOM_PX,
        delta: -40,
      }).hidden
    ).toBe(false);
  });

  it("keeps the previous visibility for trackpad jitter", () => {
    expect(
      nextMobileComposerHidden({
        ...reading,
        hidden: true,
        delta: 4,
      })
    ).toEqual({ hidden: true, accumulatedDelta: 4 });
  });
});

describe("keyboard and motion", () => {
  it("treats a tall visualViewport inset as the keyboard", () => {
    expect(isKeyboardOpen(KEYBOARD_OPEN_INSET_PX)).toBe(false);
    expect(isKeyboardOpen(KEYBOARD_OPEN_INSET_PX + 1)).toBe(true);
  });

  it("snaps the composer show/hide under prefers-reduced-motion", () => {
    expect(mobileComposerMotionClass).toContain("duration-150");
    expect(mobileComposerMotionClass).toContain("motion-reduce:transition-none");
  });
});
