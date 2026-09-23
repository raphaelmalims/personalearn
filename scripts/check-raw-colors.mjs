import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const palette =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|placeholder|caret|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
const hex = /#[0-9a-fA-F]{3,8}\b/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(path);
  }
  return out;
}

const hits = [];
for (const file of walk("src")) {
  const rel = file.split("\\").join("/");
  if (rel.startsWith("src/styles/tokens/")) continue;
  // Official Google mark colors. Not a PersonaLearn palette.
  if (rel === "src/components/auth/google-icon.tsx") continue;
  if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (palette.test(line) || hex.test(line)) {
      hits.push(`${rel}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (hits.length > 0) {
  console.error("Raw palette classes or hex colors outside src/styles/tokens:\n");
  console.error(hits.join("\n"));
  process.exit(1);
}

console.log("raw color check ok");
