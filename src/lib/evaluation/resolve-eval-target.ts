export type NamedTarget = {
  id: string;
  title: string;
};

export function normalizeEvalQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const EVAL_QUERY_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "please",
  "grade",
  "grading",
  "evaluate",
  "evaluation",
  "these",
  "this",
  "those",
  "script",
  "scripts",
  "scans",
  "photos",
  "pages",
  "on",
  "for",
  "with",
  "my",
  "our",
  "class",
  "assignment",
  "quiz",
  "exam",
  "examination",
]);

export function matchNamedTargets<T extends NamedTarget>(
  items: T[],
  query: string | null | undefined
): T[] {
  const q = query ? normalizeEvalQuery(query) : "";
  if (!q) return items;

  const tokens = q
    .split(" ")
    .filter((token) => token.length > 0 && !EVAL_QUERY_STOPWORDS.has(token));

  return items.filter((item) => {
    const title = normalizeEvalQuery(item.title);
    if (title.includes(q) || q.includes(title)) return true;
    if (tokens.length === 0) return false;
    return tokens.every((token) => title.includes(token));
  });
}

export type ResolveNamedTargetResult<T extends NamedTarget> =
  | { ok: true; item: T }
  | { ok: false; reason: "none" }
  | { ok: false; reason: "ambiguous"; candidates: T[] };

export function resolveNamedTarget<T extends NamedTarget>(
  items: T[],
  query: string | null | undefined
): ResolveNamedTargetResult<T> {
  if (items.length === 0) {
    return { ok: false, reason: "none" };
  }

  const q = query?.trim() ?? "";
  if (!q) {
    if (items.length === 1) {
      return { ok: true, item: items[0]! };
    }
    return { ok: false, reason: "ambiguous", candidates: items };
  }

  const matched = matchNamedTargets(items, q);
  if (matched.length === 1) {
    return { ok: true, item: matched[0]! };
  }
  if (matched.length > 1) {
    return { ok: false, reason: "ambiguous", candidates: matched };
  }
  if (items.length === 1) {
    return { ok: true, item: items[0]! };
  }
  return { ok: false, reason: "ambiguous", candidates: items };
}
