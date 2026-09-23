import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { convergeMark, LogoLockup, LogoMark, LogoWordmark } from "./logo";

afterEach(() => cleanup());

function numbers(d: string) {
  return d.match(/-?\d*\.?\d+/g)!.map(Number);
}

/** Mirror cubic-path x coordinates across the 24-grid centerline. */
function mirrorCubicX(d: string) {
  let index = 0;
  return d.replace(/-?\d*\.?\d+/g, (raw) => {
    const isX = index % 2 === 0;
    index += 1;
    if (!isX) return raw;
    const mirrored = 24 - Number(raw);
    return String(mirrored);
  });
}

describe("convergeMark", () => {
  it("uses one stroke weight on a 24 grid", () => {
    expect(convergeMark.viewBox).toBe("0 0 24 24");
    expect(convergeMark.strokeWidth).toBe(2);
  });

  it("mirrors the two paths across the stem", () => {
    expect(convergeMark.paths.stem.startsWith("M12 ")).toBe(true);
    expect(mirrorCubicX(convergeMark.paths.left)).toBe(convergeMark.paths.right);
  });

  it("keeps the stroke inside the viewBox", () => {
    const pad = convergeMark.strokeWidth / 2;
    for (const d of Object.values(convergeMark.paths)) {
      for (const n of numbers(d)) {
        expect(n).toBeGreaterThanOrEqual(pad);
        expect(n).toBeLessThanOrEqual(24 - pad);
      }
    }
  });

  it("keeps the shoulders apart when drawn at 16px", () => {
    const [leftX] = numbers(convergeMark.paths.left);
    const [rightX] = numbers(convergeMark.paths.right);
    const px = (units: number) => (units / 24) * 16;
    const clearGap = px(rightX - leftX) - px(convergeMark.strokeWidth);
    expect(clearGap).toBeGreaterThan(6);
  });
});

describe("LogoMark", () => {
  it("paints a monoline currentColor glyph", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg?.querySelectorAll("path")).toHaveLength(3);
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("circle")).toBeNull();
  });

  it("can be named when it is the only brand label", () => {
    render(<LogoMark title="PersonaLearn" />);
    expect(screen.getByRole("img", { name: "PersonaLearn" })).toBeInTheDocument();
  });
});

describe("LogoWordmark", () => {
  it("renders the product name", () => {
    render(<LogoWordmark />);
    expect(screen.getByText("PersonaLearn")).toBeInTheDocument();
  });
});

describe("LogoLockup", () => {
  it("pairs the mark with the wordmark", () => {
    const { container } = render(<LogoLockup />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("PersonaLearn")).toBeInTheDocument();
  });
});
