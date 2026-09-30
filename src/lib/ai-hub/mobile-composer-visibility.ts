/** Ignore subpixel noise; smaller moves accumulate until this threshold. */
export const MOBILE_COMPOSER_SCROLL_PX = 12;

/** Latest messages are on screen — keep the composer available. */
export const MOBILE_COMPOSER_NEAR_BOTTOM_PX = 64;

/** visualViewport shrink past this is the software keyboard, not browser chrome. */
export const KEYBOARD_OPEN_INSET_PX = 80;

/**
 * 150ms matches `--duration-fast`. `motion-reduce:transition-none` snaps
 * show/hide when the teacher prefers reduced motion.
 */
export const mobileComposerMotionClass =
  "grid transition-[grid-template-rows,opacity] duration-150 ease-out motion-reduce:transition-none";

export function isKeyboardOpen(insetPx: number): boolean {
  return insetPx > KEYBOARD_OPEN_INSET_PX;
}

export type MobileComposerVisibilityInput = {
  delta: number;
  accumulatedDelta: number;
  distanceFromBottom: number;
  composerFocused: boolean;
  keyboardOpen: boolean;
  hidden: boolean;
};

export type MobileComposerVisibility = {
  hidden: boolean;
  accumulatedDelta: number;
};

/**
 * Hide the mobile composer while the teacher scrolls up through older
 * messages. Show it on the way back down. Focus and an open keyboard keep it
 * visible regardless of scroll direction.
 */
export function nextMobileComposerHidden(
  input: MobileComposerVisibilityInput
): MobileComposerVisibility {
  if (
    input.composerFocused ||
    input.keyboardOpen ||
    input.distanceFromBottom <= MOBILE_COMPOSER_NEAR_BOTTOM_PX
  ) {
    return { hidden: false, accumulatedDelta: 0 };
  }

  const accumulated = input.accumulatedDelta + input.delta;
  if (accumulated <= -MOBILE_COMPOSER_SCROLL_PX) {
    return { hidden: true, accumulatedDelta: 0 };
  }
  if (accumulated >= MOBILE_COMPOSER_SCROLL_PX) {
    return { hidden: false, accumulatedDelta: 0 };
  }
  return { hidden: input.hidden, accumulatedDelta: accumulated };
}
