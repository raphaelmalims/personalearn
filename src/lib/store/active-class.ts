import { create } from "zustand";
import { persist } from "zustand/middleware";
import { coerceClassLevel, type ClassLevelCode } from "@/lib/classes/level";

export type ActiveClass = {
  id: string;
  name: string;
  grade_level: ClassLevelCode;
  subject: string;
  section: string | null;
  term: number;
};

type ActiveClassState = {
  activeClass: ActiveClass | null;
  setActiveClass: (activeClass: ActiveClass | null) => void;
  clearActiveClass: () => void;
};

export const useActiveClassStore = create<ActiveClassState>()(
  persist(
    (set) => ({
      activeClass: null,
      setActiveClass: (activeClass) => set({ activeClass }),
      clearActiveClass: () => set({ activeClass: null }),
    }),
    {
      name: "personalearn-active-class",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { activeClass: ActiveClass | null };
        const level = state.activeClass?.grade_level;
        const code = coerceClassLevel(level);
        if (state.activeClass && code) {
          state.activeClass.grade_level = code;
        }
        return state;
      },
    }
  )
);
