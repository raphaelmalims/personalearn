import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassEditDialog } from "./class-edit-dialog";
import type { Class } from "@/types/database";

const update = vi.fn().mockResolvedValue({});
const archive = vi.fn().mockResolvedValue("class-1");
const setActiveClass = vi.fn();
const push = vi.fn();
let classes: Class[] = [];

const cls: Class = {
  id: "class-1",
  teacher_id: "teacher-1",
  name: "Maths A",
  grade_level: "g5",
  subject: "Mathematics",
  term: 1,
  academic_year: "2026",
  section: "A",
  is_active: true,
  created_at: "",
  updated_at: "",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/hooks/use-classes", () => ({
  useUpdateClass: () => ({ mutateAsync: update, isPending: false }),
  useArchiveClass: () => ({ mutateAsync: archive, isPending: false }),
  useClasses: () => ({ data: classes }),
}));

vi.mock("@/lib/store/active-class", () => ({
  useActiveClassStore: (selector: (state: { activeClass: { id: string }; setActiveClass: typeof setActiveClass }) => unknown) =>
    selector({
      activeClass: { id: "class-1" },
      setActiveClass,
    }),
}));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

afterEach(() => {
  cleanup();
  update.mockClear();
  archive.mockClear();
  setActiveClass.mockClear();
  push.mockClear();
});

describe("ClassEditDialog", () => {
  it("persists edits through useUpdateClass", async () => {
    const user = userEvent.setup();
    classes = [cls];
    render(<ClassEditDialog cls={cls} open showTrigger={false} onOpenChange={vi.fn()} />);

    const name = screen.getByLabelText("Class name");
    await user.clear(name);
    await user.type(name, "Maths Updated");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: "class-1",
        values: expect.objectContaining({ name: "Maths Updated", subject: "Mathematics" }),
      })
    );
  });

  it("selects the next active class after archive", async () => {
    const user = userEvent.setup();
    classes = [cls, { ...cls, id: "class-2", name: "Science B", subject: "Science" }];
    render(<ClassEditDialog cls={cls} open showTrigger={false} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Archive class" }));
    expect(screen.getByRole("heading", { name: "Archive class?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(archive).toHaveBeenCalledWith("class-1");
    expect(setActiveClass).toHaveBeenCalledWith(expect.objectContaining({ id: "class-2" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("sends the teacher to onboarding when no class remains", async () => {
    const user = userEvent.setup();
    classes = [cls];
    render(<ClassEditDialog cls={cls} open showTrigger={false} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Archive class" }));
    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(push).toHaveBeenCalledWith("/onboarding");
  });
});
