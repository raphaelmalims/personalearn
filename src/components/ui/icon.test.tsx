import { render } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icon";

describe("Icon", () => {
  it("defaults to a 16px glyph with a 1.5 stroke", () => {
    const { container } = render(<Icon icon={Search} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
    expect(svg).toHaveAttribute("stroke-width", "1.5");
  });

  it("maps sm and lg to 14 and 20", () => {
    const { container, rerender } = render(<Icon icon={Search} size="sm" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "14");
    rerender(<Icon icon={Search} size="lg" />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
  });
});
