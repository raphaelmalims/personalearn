import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiagramStudio } from "@/components/diagrams/diagram-studio";
import { SAMPLE_DIAGRAM } from "@/lib/diagrams/content";

describe("diagram studio", () => {
  it("shows a part name and explanation in Explore", async () => {
    const user = userEvent.setup();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} />);
    await user.click(screen.getByRole("button", { name: "Evaporation" }));
    expect(screen.getByRole("heading", { name: "Evaporation" })).toBeInTheDocument();
    expect(screen.getByText(/rises as vapour/)).toBeInTheDocument();
  });

  it("reaches a part from the keyboard", async () => {
    const user = userEvent.setup();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} />);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Evaporation" })).toBeInTheDocument();
  });

  it("records a wrong Find it tap", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} onAnswer={onAnswer} />);
    const modes = screen.getByRole("group", { name: "Diagram mode" });
    await user.click(within(modes).getByRole("button", { name: "Find it" }));
    await user.click(screen.getByRole("button", { name: "Region 4" }));
    expect(onAnswer).toHaveBeenCalledWith({
      partId: "evaporation",
      mode: "find",
      correct: false,
    });
    expect(screen.getByText(/Not that part/)).toBeInTheDocument();
  });

  it("places a label onto the matching part", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} onAnswer={onAnswer} />);
    const modes = screen.getByRole("group", { name: "Diagram mode" });
    await user.click(within(modes).getByRole("button", { name: "Name it" }));
    await user.click(screen.getByRole("button", { name: "Collection" }));
    await user.click(screen.getByRole("button", { name: "Region 4" }));
    expect(onAnswer).toHaveBeenCalledWith({
      partId: "collection",
      mode: "name",
      correct: true,
    });
    expect(screen.getByText("Placed.")).toBeInTheDocument();
  });
});
