export type ComposerEnterAction = "send" | "newline" | "ignore";

/**
 * Desktop: Enter sends, Shift+Enter is a newline.
 * Coarse pointer (phone keyboard): Enter is a newline; send is the button.
 * IME composition never sends.
 */
export function composerEnterAction(input: {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  coarsePointer: boolean;
}): ComposerEnterAction {
  if (input.key !== "Enter") return "ignore";
  if (input.isComposing) return "ignore";
  if (input.shiftKey || input.coarsePointer) return "newline";
  return "send";
}

export function isImeComposing(event: {
  isComposing?: boolean;
  keyCode?: number;
}): boolean {
  return Boolean(event.isComposing || event.keyCode === 229);
}

export function pointerIsCoarse(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}
