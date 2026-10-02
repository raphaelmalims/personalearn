#!/usr/bin/env node
// Advisory PR body lint. Does not run in CI.
// Usage: node scripts/pr-body-lint.mjs body.md   (exit 1 on FAIL, 0 on pass/warn)
import { readFileSync } from "node:fs";
const body = readFileSync(process.argv[2] ?? 0, "utf8").replace(/<!--[\s\S]*?-->/g, "");
const bytes = Buffer.byteLength(body);
const warn = [], fail = [];
const sections = body.split(/^## /m).slice(1).map((s) => {
  const [title, ...rest] = s.split("\n");
  return { title: title.trim(), text: rest.join("\n") };
});
if (bytes > 3000) fail.push(`body is ${bytes} B (limit 3000, target 600-1500)`);
else if (bytes > 2000) warn.push(`body is ${bytes} B (target 600-1500)`);
const allowed = /^(summary|test plan)$/i;
for (const s of sections)
  if (!allowed.test(s.title)) warn.push(`extra section "${s.title}" (metadata lives in GitHub fields; fold real risks into Summary)`);
// Tokens that carry facts: `code`, URLs, PSL ids, #numbers. Same token in 2+ sections = likely repetition.
const tok = (t) => new Set((t.match(/`[^`]+`|https?:\/\/\S+|PSL-\d+|#\d+/g) ?? []).map((x) => x.replace(/[).,;]+$/, "")));
const seen = new Map();
for (const s of sections) for (const t of tok(s.text)) seen.set(t, [...(seen.get(t) ?? []), s.title]);
const dup = [...seen].filter(([t, v]) => v.length > 1 && t.length > 6 && !/^`npm |^`(lint|build|test)`$/.test(t));
if (dup.length >= 3) warn.push(`${dup.length} facts appear in 2+ sections: ${dup.slice(0, 4).map(([t, v]) => `${t} (${v.join("+")})`).join("; ")}`);
// Repeated sentences (6+ words) across the whole body.
const sents = body.split(/(?<=[.!?])\s+/).map((s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()).filter((s) => s.split(" ").length >= 6);
const dupS = sents.filter((s, i) => sents.indexOf(s) !== i);
if (dupS.length) warn.push(`${dupS.length} repeated sentence(s)`);
// Inventory dumps: long comma/semicolon lists, many bullets in Summary.
const summary = sections.find((s) => /^summary$/i.test(s.title))?.text ?? "";
const bullets = (summary.match(/^\s*[-*] /gm) ?? []).length;
if (bullets > 4) warn.push(`Summary has ${bullets} bullets (describe the change; the diff has the inventory)`);
const longList = body.split("\n").filter((l) => (l.match(/[,;]/g) ?? []).length >= 10);
if (longList.length) warn.push(`${longList.length} line(s) with 10+ commas/semicolons (inventory?)`);
// Test plan hygiene.
const tp = sections.find((s) => /^test plan$/i.test(s.title))?.text ?? "";
const boxes = tp.split("\n").filter((l) => /^\s*- \[[ x]\]/.test(l));
if (boxes.some((l) => /_\(.*\)_/.test(l))) fail.push("Test plan still has template placeholder text");
if (boxes.filter((l) => /^\s*- \[ \]/.test(l) && !/N\/A/i.test(l)).length) warn.push("unchecked Test plan box without N/A");
const longBox = boxes.filter((l) => l.length > 220);
if (longBox.length) warn.push(`${longBox.length} Test plan line(s) over 220 chars (put detail in Summary or a link)`);
console.log(`${fail.length ? "FAIL" : warn.length ? "WARN" : "OK"} ${bytes} B`);
for (const m of fail) console.log(`  FAIL ${m}`);
for (const m of warn) console.log(`  warn ${m}`);
process.exit(fail.length ? 1 : 0);
