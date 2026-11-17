/** Caption starts in the process-flow timeline, in milliseconds. */
export const NARRATION_CUE_MS = [1050, 3450, 5850, 8250] as const;

export type NarrationVoice = {
  lang: string;
  name?: string;
};

export function narrationCues(stepCount: number) {
  const count = Math.max(0, Math.min(NARRATION_CUE_MS.length, stepCount));
  return NARRATION_CUE_MS.slice(0, count);
}

/** Browser Web Speech voice for the explainer language, or null for captions only. */
export function pickNarrationVoice(
  voices: NarrationVoice[],
  language: string
): NarrationVoice | null {
  const prefix = language.trim().toLowerCase();
  if (!prefix) return null;
  return (
    voices.find((voice) => voice.lang.trim().toLowerCase().startsWith(prefix)) ?? null
  );
}
