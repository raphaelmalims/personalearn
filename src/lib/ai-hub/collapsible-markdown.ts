export type MarkdownBlock =
  | { kind: "markdown"; text: string }
  | { kind: "collapse"; title: string; body: string };

const COLLAPSE_BLOCK = /:::collapse[ \t]+([^\n]+)\n([\s\S]*?)\n:::/g;

/** Pulls `:::collapse Title` blocks out so the chat can render a real disclosure. */
export function splitCollapsibleMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let cursor = 0;
  for (const match of source.matchAll(COLLAPSE_BLOCK)) {
    const index = match.index ?? 0;
    const before = source.slice(cursor, index).trim();
    if (before) blocks.push({ kind: "markdown", text: before });
    const title = match[1]?.trim() ?? "";
    const body = match[2]?.trim() ?? "";
    if (title && body) blocks.push({ kind: "collapse", title, body });
    cursor = index + match[0].length;
  }
  const rest = source.slice(cursor).trim();
  if (rest) blocks.push({ kind: "markdown", text: rest });
  if (blocks.length === 0 && source.trim()) {
    blocks.push({ kind: "markdown", text: source.trim() });
  }
  return blocks;
}
