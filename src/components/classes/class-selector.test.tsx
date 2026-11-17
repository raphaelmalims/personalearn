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
        grade_level: 5,
        subject: "Mathematics",
        section: "A",
        term: 1,
        academic_year: "2026",
        is_active: true,
      },
      {
        id: "class-2",
        name: "Science B",
        grade_level: 6,
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
  useActiveClassStore: (selector: (state: { activeClass: { id: string } | null; setActiveClass: typeof setActiveClass }) => unknown) =>
    selector({
      activeClass: {
        id: "class-1",
        name: "Maths A",
        grade_level: 5,
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

afterEach(() => {
  cleanup();
  setActiveClass.mockClear();
});

describe("ClassSelector", () => {
  it("switches the active class and mounts create after onboarding", async () => {
    const user = userEvent.setup();
    render(<ClassSelector fill />);

    await user.click(screen.getByRole("button", { name: /G5 Mathematics/ }));
    expect(screen.getByRole("menuitem", { name: "New class" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "New class" }));
    expect(screen.getByText("Create class dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /G5 Mathematics/ }));
    await user.click(screen.getByRole("menuitem", { name: "G6 Science · B" }));
    expect(setActiveClass).toHaveBeenCalledWith(
      expect.objectContaining({ id: "class-2", subject: "Science" })
    );
  });
});
