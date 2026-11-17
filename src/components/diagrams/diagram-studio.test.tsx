import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiagramStudio } from "@/components/diagrams/diagram-studio";
import { SAMPLE_DIAGRAM } from "@/lib/diagrams/content";

describe("diagram studio", () => {
  it("names a part on the picture", () => {
    render(<DiagramStudio content={SAMPLE_DIAGRAM} />);
    expect(screen.getByRole("button", { name: "Evaporation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Find it" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Name it" })).not.toBeInTheDocument();
    expect(screen.getByText(SAMPLE_DIAGRAM.parts[0]!.prompt)).toBeInTheDocument();
  });

  it("reaches a part from the keyboard", async () => {
    const user = userEvent.setup();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/Right\. The sun heats water/)).toBeInTheDocument();
  });

  it("keeps a wrong tap with the question that asked it", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<DiagramStudio content={SAMPLE_DIAGRAM} onAnswer={onAnswer} />);
    const asked = SAMPLE_DIAGRAM.parts[0]!.prompt;
    await user.click(screen.getByRole("button", { name: "Collection" }));
    expect(onAnswer).toHaveBeenCalledWith({
      partId: "evaporation",
      mode: "find",
      correct: false,
    });
    expect(screen.getByText(asked)).toBeInTheDocument();
    expect(screen.getByText("Not that part.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Not that part.")).not.toBeInTheDocument();
    }, { timeout: 2500 });
    expect(screen.queryByText(asked)).not.toBeInTheDocument();
    expect(screen.getByText(SAMPLE_DIAGRAM.parts[1]!.prompt)).toBeInTheDocument();
  });
});
