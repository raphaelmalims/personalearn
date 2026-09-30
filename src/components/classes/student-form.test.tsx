import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STUDENT_INTERESTS_MAX_LENGTH } from "@/lib/students/interests";
import { StudentForm } from "./student-form";

const mutateAsync = vi.fn();

vi.mock("@/lib/hooks/use-classes", () => ({
  useCreateStudent: () => ({
    mutateAsync,
    isPending: false,
    error: null,
  }),
}));

afterEach(() => {
  cleanup();
  mutateAsync.mockReset();
});

describe("StudentForm", () => {
  it("submits optional interests with the create payload", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: "s-new" });

    render(<StudentForm classId="class-1" submitLabel="Add to roster" />);

    const interests = screen.getByLabelText("Interests / passions (optional)");
    expect(interests).toHaveAttribute("maxLength", String(STUDENT_INTERESTS_MAX_LENGTH));
    expect(interests).toHaveAttribute(
      "placeholder",
      "e.g. football, choir, drawing"
    );

    await user.type(screen.getByLabelText("Full name"), "Ada Lovelace");
    await user.selectOptions(screen.getByLabelText("Gender (optional)"), "Female");
    await user.type(interests, "football, choir");
    await user.click(screen.getByRole("button", { name: "Add to roster" }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Ada Lovelace",
        gender: "Female",
        interests: "football, choir",
      })
    );
  });

  it("allows create without interests", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: "s-new" });

    render(<StudentForm classId="class-1" />);

    await user.type(screen.getByLabelText("Full name"), "Grace Hopper");
    await user.selectOptions(screen.getByLabelText("Gender (optional)"), "Male");
    await user.click(screen.getByRole("button", { name: "Add student" }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Grace Hopper",
        interests: "",
      })
    );
  });
});
