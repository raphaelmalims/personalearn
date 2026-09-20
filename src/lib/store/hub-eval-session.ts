import { create } from "zustand";

export type HubEvalView = "batch" | "script";

type HubEvalSessionState = {
  expanded: boolean;
  classId: string | null;
  batchId: string | null;
  assessmentId: string | null;
  scriptId: string | null;
  view: HubEvalView;
  composerHint: string | null;
  openBatch: (input: {
    classId: string;
    batchId: string;
    assessmentId?: string | null;
    scriptId?: string | null;
  }) => void;
  openScript: (scriptId: string, assessmentId?: string | null) => void;
  backToQueue: () => void;
  collapse: () => void;
  setComposerHint: (hint: string | null) => void;
};

export const useHubEvalSessionStore = create<HubEvalSessionState>((set) => ({
  expanded: false,
  classId: null,
  batchId: null,
  assessmentId: null,
  scriptId: null,
  view: "batch",
  composerHint: null,
  openBatch: ({ classId, batchId, assessmentId, scriptId }) =>
    set({
      expanded: true,
      classId,
      batchId,
      assessmentId: assessmentId ?? null,
      scriptId: scriptId ?? null,
      view: scriptId ? "script" : "batch",
    }),
  openScript: (scriptId, assessmentId) =>
    set((state) => ({
      expanded: true,
      scriptId,
      assessmentId: assessmentId ?? state.assessmentId,
      view: "script",
    })),
  backToQueue: () => set({ view: "batch", scriptId: null }),
  collapse: () => set({ expanded: false, view: "batch", scriptId: null }),
  setComposerHint: (hint) => set({ composerHint: hint }),
}));
