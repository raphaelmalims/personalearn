import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Student } from "@/types/database";
import { StudentInterestsEditor } from "./student-interests-editor";

const mutateAsync = vi.fn();

vi.mock("@/lib/hooks/use-classes", () => ({
  useUpdateStudent: () => ({
    mutateAsync,
    isPending: false,
    error: null,
  }),
}));

afterEach(() => {
  cleanup();
  mutateAsync.mockReset();
});

const student: Student = {
  id: "s1",
  class_id: "class-1",
  admission_number: "A001",
  full_name: "Ada Lovelace",
  gender: "Female",
  interests: null,
  metadata: {},
  created_at: "2026-09-20T00:00:00Z",
};

describe("StudentInterestsEditor", () => {
  it("shows the empty placeholder and saves typed interests", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ ...student, interests: "football, choir" });

    render(<StudentInterestsEditor classId="class-1" student={student} />);

    const field = screen.getByLabelText("Interests / passions");
    expect(field).toHaveAttribute(
      "placeholder",
      "e.g. football, choir, drawing"
    );

    await user.type(field, "football, choir");
    await user.click(screen.getByRole("button", { name: "Save interests" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "s1",
      interests: "football, choir",
    });
  });

  it("does not render metadata JSON", () => {
    render(
      <StudentInterestsEditor
        classId="class-1"
        student={{ ...student, metadata: { secret: "nope" } }}
      />
    );
    expect(screen.queryByText(/nope/)).not.toBeInTheDocument();
    expect(screen.queryByText(/metadata/i)).not.toBeInTheDocument();
  });
});
