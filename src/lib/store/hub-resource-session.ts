import { create } from "zustand";
import { runViewTransition } from "@/lib/ui/view-transition";
import { useHubEvalSessionStore } from "@/lib/store/hub-eval-session";

type HubResourceSessionState = {
  openResourceId: string | null;
  classId: string | null;
  fullscreen: boolean;
  openResource: (input: { classId: string; resourceId: string }) => void;
  setFullscreen: (fullscreen: boolean) => void;
  close: () => void;
};

export const useHubResourceSessionStore = create<HubResourceSessionState>(
  (set, get) => ({
    openResourceId: null,
    classId: null,
    fullscreen: false,
    openResource: ({ classId, resourceId }) => {
      useHubEvalSessionStore.getState().collapse();
      runViewTransition(() =>
        set({
          classId,
          openResourceId: resourceId,
          fullscreen: false,
        })
      );
    },
    setFullscreen: (fullscreen) => {
      if (get().fullscreen === fullscreen) return;
      runViewTransition(() => set({ fullscreen }));
    },
    close: () => {
      if (!get().openResourceId) return;
      runViewTransition(() =>
        set({
          openResourceId: null,
          classId: null,
          fullscreen: false,
        })
      );
    },
  })
);
