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

  it("starts collapsed and toggles with click and keyboard", async () => {
    const user = userEvent.setup();
    render(<ThoughtProcess reasoning={reasoning} reasoningMs={3200} />);

    const button = screen.getByRole("button", { name: /Thought for 3s/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveClass("grid-rows-[0fr]");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(button.className).toContain("focus-visible:ring-ring");
    expect(panel?.className).toContain("motion-reduce:transition-none");
    expect(panel?.querySelector(".max-h-60")).toBeTruthy();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveClass("grid-rows-[1fr]");
    expect(screen.getByText(reasoning)).toBeVisible();

    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("streams open with Thinking… then collapses to the measured duration", () => {
    const { rerender } = render(
      <ThoughtProcess reasoning={reasoning} isStreaming hasResponseContent={false} />
    );

    const button = screen.getByRole("button", { name: /Thinking…/ });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.innerHTML).toContain("motion-reduce:animate-none");

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
