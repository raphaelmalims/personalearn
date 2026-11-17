import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassSelector } from "./class-selector";

const setActiveClass = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/ai-hub",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/lib/hooks/use-classes", () => ({
  useClasses: () => ({
    isLoading: false,
    data: [
      {
        id: "class-1",
        name: "Maths A",
        grade_level: "g5",
        subject: "Mathematics",
        section: "A",
        term: 1,
        academic_year: "2026",
        is_active: true,
      },
      {
        id: "class-2",
        name: "Science B",
        grade_level: "g6",
        subject: "Science",
        section: "B",
        term: 2,
        academic_year: "2026",
        is_active: true,
      },
    ],
  }),
}));

vi.mock("@/lib/store/active-class", () => ({
  useActiveClassStore: (
    selector: (state: {
      activeClass: {
        id: string;
        name: string;
        grade_level: string;
        subject: string;
        section: string | null;
        term: number;
      } | null;
      setActiveClass: typeof setActiveClass;
    }) => unknown
  ) =>
    selector({
      activeClass: {
        id: "class-1",
        name: "Maths A",
        grade_level: "g5",
        subject: "Mathematics",
        section: "A",
        term: 1,
      },
      setActiveClass,
    }),
}));

vi.mock("@/components/classes/class-create-dialog", () => ({
  ClassCreateDialog: ({ open }: { open?: boolean }) =>
    open ? <div>Create class dialog</div> : null,
}));

vi.mock("@/components/classes/class-edit-dialog", () => ({
  ClassEditDialog: ({ open }: { open?: boolean }) =>
    open ? <div>Edit class dialog</div> : null,
}));

afterEach(() => {
  cleanup();
  setActiveClass.mockClear();
});

describe("ClassSelector", () => {
  it("switches the active class and mounts create and edit after onboarding", async () => {
    const user = userEvent.setup();
    render(<ClassSelector fill />);

    await user.click(screen.getByRole("button", { name: "Class: Maths A" }));
    const activeRow = screen.getByRole("menuitem", { name: /Maths A/ });
    expect(activeRow).toHaveTextContent("Grade 5 Mathematics · A");
    expect(activeRow.querySelector(".opacity-100")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "New class" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Science B" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "New class" }));
    expect(screen.getByText("Create class dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Class: Maths A" }));
    await user.click(screen.getByRole("button", { name: "Edit Science B" }));
    expect(screen.getByText("Edit class dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /Science B/ }));
    expect(setActiveClass).toHaveBeenCalledWith(
      expect.objectContaining({ id: "class-2", subject: "Science" })
    );
  });

  it("clamps the open menu to the viewport so edit controls stay inside", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const trigger = this.hasAttribute("data-pl-dropdown-trigger");
      const width = trigger ? 200 : 1790;
      const left = trigger ? 24 : 0;
      return {
        width,
        height: 40,
        top: 48,
        bottom: 88,
        left,
        right: left + width,
        x: left,
        y: 48,
        toJSON() {
          return {};
        },
      };
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });

    render(<ClassSelector fill />);
    await user.click(screen.getByRole("button", { name: "Class: Maths A" }));

    const panel = document.querySelector("[data-pl-dropdown-panel]");
    expect(panel).toBeTruthy();
    const width = Number.parseFloat((panel as HTMLElement).style.width);
    expect(width).toBeGreaterThanOrEqual(240);
    expect(width).toBeLessThanOrEqual(320);
    expect(width).not.toBe(1790);
    expect(panel?.className).not.toMatch(/(^|\s)w-full(\s|$)/);
    vi.restoreAllMocks();
  });

  it("moves between class rows, selects with Enter, and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(<ClassSelector />);

    const trigger = screen.getByRole("button", { name: "Class: Maths A" });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: /Maths A/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Science B/ })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(setActiveClass).toHaveBeenCalledWith(expect.objectContaining({ id: "class-2" }));
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(document.querySelector("[data-pl-dropdown-panel]")).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
