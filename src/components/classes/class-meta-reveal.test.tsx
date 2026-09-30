import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ClassMetaReveal, formatClassMeta } from "./class-meta-reveal";

afterEach(() => cleanup());

const cls = {
  name: "Grade 5 Maths",
  grade_level: 5,
  subject: "Mathematics",
  term: 2,
  section: "A",
};

describe("formatClassMeta", () => {
  it("lists grade, subject, and term", () => {
    expect(formatClassMeta({ ...cls, section: null })).toBe(
      "Grade 5 · Mathematics · Term 2"
    );
  });

  it("appends the section when the class has one", () => {
    expect(formatClassMeta(cls)).toBe(
      "Grade 5 · Mathematics · Term 2 · Section A"
    );
  });
});

describe("ClassMetaReveal", () => {
  it("keeps the class name primary and the metadata collapsed by default", () => {
    render(<ClassMetaReveal cls={cls} />);

    const trigger = screen.getByRole("button", { name: "Grade 5 Maths" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Still in the accessibility tree while visually hidden.
    expect(screen.getByText(formatClassMeta(cls))).toHaveClass("sr-only");
  });

  it("reveals the metadata on hover", async () => {
    const user = userEvent.setup();
    render(<ClassMetaReveal cls={cls} />);

    await user.hover(screen.getByRole("button", { name: "Grade 5 Maths" }));

    expect(
      screen.getByRole("button", { name: "Grade 5 Maths" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(formatClassMeta(cls))).not.toHaveClass("sr-only");
  });

  it("reveals the metadata on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<ClassMetaReveal cls={cls} />);

    await user.tab();

    const trigger = screen.getByRole("button", { name: "Grade 5 Maths" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("describes the name with the metadata region", () => {
    render(<ClassMetaReveal cls={cls} />);

    const trigger = screen.getByRole("button", { name: "Grade 5 Maths" });
    const describedBy = trigger.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      formatClassMeta(cls)
    );
  });

  it("pins the metadata open on tap, where there is no hover", async () => {
    const user = userEvent.setup();
    render(<ClassMetaReveal cls={cls} />);

    const trigger = screen.getByRole("button", { name: "Grade 5 Maths" });
    await user.click(trigger);
    await user.unhover(trigger);
    trigger.blur();

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
