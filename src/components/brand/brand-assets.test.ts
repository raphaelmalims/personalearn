import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convergeMark } from "./logo";

const root = path.resolve(__dirname, "../../..");

function pngSize(file: string) {
  const buf = readFileSync(file);
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("brand assets", () => {
  it("keeps the favicon on the same Converge paths", () => {
    const svg = readFileSync(path.join(root, "src/app/icon.svg"), "utf8");
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain("prefers-color-scheme: dark");
    expect(svg).toContain("#fff");
    for (const d of Object.values(convergeMark.paths)) {
      expect(svg).toContain(`d="${d}"`);
    }
    expect(svg).not.toContain("#0C6B63");
  });

  it("ships maskable PWA icons and an apple touch icon", () => {
    expect(pngSize(path.join(root, "public/icons/icon-192.png"))).toEqual({
      width: 192,
      height: 192,
    });
    expect(pngSize(path.join(root, "public/icons/icon-512.png"))).toEqual({
      width: 512,
      height: 512,
    });
    expect(pngSize(path.join(root, "src/app/apple-icon.png"))).toEqual({
      width: 180,
      height: 180,
    });
    expect(pngSize(path.join(root, "src/app/opengraph-image.png"))).toEqual({
      width: 1200,
      height: 630,
    });
    expect(existsSync(path.join(root, "public/icons/icon-192.svg"))).toBe(false);
    expect(existsSync(path.join(root, "public/icons/icon-512.svg"))).toBe(false);
  });

  it("points the manifest at the maskable PNGs", () => {
    const manifest = JSON.parse(readFileSync(path.join(root, "public/manifest.json"), "utf8"));
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string; purpose: string }>;
    expect(icons.map((icon) => icon.src).sort()).toEqual([
      "/icons/icon-192.png",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-512.png",
    ]);
    expect(icons.every((icon) => icon.type === "image/png")).toBe(true);
    expect(icons.map((icon) => icon.purpose).sort()).toEqual(["any", "any", "maskable", "maskable"]);
  });
});
