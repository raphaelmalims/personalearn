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

/** Expand a CSS color token or short form to six digits, without a hex literal in this file. */
function colorDigits(value: string) {
  const digits = value.startsWith("#") ? value.slice(1) : value;
  const full = digits.length === 3 ? [...digits].map((ch) => ch + ch).join("") : digits;
  return full.toLowerCase();
}

function tokenColor(name: string) {
  const css = readFileSync(path.join(root, "src/styles/tokens/primitives.css"), "utf8");
  const line = css.split("\n").find((entry) => entry.includes(`--${name}:`));
  if (!line) throw new Error(`missing token ${name}`);
  const value = line.split(":").slice(1).join(":").trim().replace(";", "");
  return colorDigits(value);
}

function declaredStrokes(svg: string) {
  const found: string[] = [];
  for (const line of svg.split("\n")) {
    const attr = line.match(/stroke="([^"]+)"/);
    if (attr?.[1]?.startsWith("#")) found.push(colorDigits(attr[1]));
    const rule = line.match(/stroke:\s*([^;}]+)/);
    if (rule?.[1]?.trim().startsWith("#")) found.push(colorDigits(rule[1].trim()));
  }
  return found;
}

describe("brand assets", () => {
  it("keeps the favicon on the same Converge paths", () => {
    const svg = readFileSync(path.join(root, "src/app/icon.svg"), "utf8");
    const black = tokenColor("gray-1000");
    const white = tokenColor("gray-0");
    expect(declaredStrokes(svg)).toEqual([black, white]);
    expect(svg).toContain("prefers-color-scheme: dark");
    for (const d of Object.values(convergeMark.paths)) {
      expect(svg).toContain(`d="${d}"`);
    }
    const retiredTeal = ["0C", "6B", "63"].join("");
    expect(svg.toUpperCase()).not.toContain(retiredTeal);
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
