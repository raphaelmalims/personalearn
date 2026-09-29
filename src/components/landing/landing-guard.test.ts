import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

describe("retired photo hero", () => {
  it("removes the classroom photo and the hero color tokens", () => {
    expect(existsSync(path.join(root, "public/images/hero-classroom.jpg"))).toBe(false);
    expect(existsSync(path.join(root, "src/components/layout/hero-backdrop.tsx"))).toBe(false);

    const semantic = readFileSync(path.join(root, "src/styles/tokens/semantic.css"), "utf8");
    const globals = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
    expect(semantic).not.toContain("--hero-");
    expect(globals).not.toContain("--hero-");
    expect(globals).not.toContain("hero-overlay");
  });
});
