import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActiveClassHydrator } from "./active-class-hydrator";

const setActiveClass = vi.fn();
let classes: { id: string; name: string; grade_level: string; subject: string; section: string | null; term: number }[] = [];
let isFetching = false;
let activeId: string | null = "new-class";

vi.mock("@/lib/hooks/use-classes", () => ({
  useClasses: () => ({ data: classes, isSuccess: true, isFetching }),
}));

vi.mock("@/lib/store/active-class", () => ({
  useActiveClassStore: (selector: (state: { activeClass: { id: string } | null; setActiveClass: typeof setActiveClass }) => unknown) =>
    selector({
      activeClass: activeId ? { id: activeId } : null,
      setActiveClass,
    }),
}));

afterEach(() => {
  cleanup();
  setActiveClass.mockClear();
});

describe("ActiveClassHydrator", () => {
  it("keeps the class just created while the list is still refetching", () => {
    classes = [
      { id: "older", name: "QA 4", grade_level: "g7", subject: "Mathematics", section: "A", term: 1 },
    ];
    isFetching = true;
    activeId = "new-class";

    render(<ActiveClassHydrator />);

    expect(setActiveClass).not.toHaveBeenCalled();
  });

  it("switches to the new class once that row is in the list", () => {
    classes = [
      { id: "new-class", name: "QA 5", grade_level: "g7", subject: "Mathematics", section: "A", term: 1 },
      { id: "older", name: "QA 4", grade_level: "g7", subject: "Mathematics", section: "B", term: 1 },
    ];
    isFetching = false;
    activeId = "new-class";

    render(<ActiveClassHydrator />);

    expect(setActiveClass).not.toHaveBeenCalled();
  });
});
