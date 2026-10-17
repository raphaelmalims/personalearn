import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThoughtProcess } from "@/components/ai-hub/thought-process";

afterEach(() => cleanup());

const reasoning = "Check the scheme of work, then draft a short quiz.";

describe("ThoughtProcess", () => {
  it("is hidden when reasoning is empty", () => {
    const { container } = render(
      <ThoughtProcess reasoning="   " reasoningMs={1200} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("starts collapsed as Thought for Ns and expands in a scroll area", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ThoughtProcess
        reasoning={reasoning}
        reasoningMs={3200}
        answerLabel="DeepSeek Flash"
        answerTitle="DeepSeek Flash · Thinking · Low"
      />
    );

    const button = screen.getByRole("button", { name: /Thought for 3s/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("DeepSeek Flash");
    expect(button.className).toContain("focus-visible:ring-ring");
    expect(container.querySelector(".border")).toBeNull();
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveClass("hidden");
    expect(panel).toHaveClass("max-h-40");
    expect(panel?.className).not.toContain("border");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("inert");
    expect(screen.getByText(reasoning)).toBeVisible();

    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("inert");
  });

  it("says Thought without a duration when reasoning_ms was not stored", () => {
    render(<ThoughtProcess reasoning={reasoning} reasoningMs={null} />);
    const button = screen.getByRole("button", { name: "Thought" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveTextContent("Thought for");
  });

  it("streams Thinking… with the reasoning visible, then collapses", () => {
    const { rerender } = render(
      <ThoughtProcess reasoning={reasoning} isStreaming hasResponseContent={false} />
    );

    const button = screen.getByRole("button", { name: "Thinking…" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.innerHTML).toContain("motion-reduce:animate-none");
    expect(screen.getByText(reasoning)).toBeVisible();
    const panel = document.getElementById(button.getAttribute("aria-controls")!);
    expect(panel).not.toHaveAttribute("inert");

    rerender(
      <ThoughtProcess
        reasoning={reasoning}
        isStreaming
        hasResponseContent
        reasoningMs={4000}
      />
    );

    expect(screen.getByRole("button", { name: /Thought for 4s/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
