import { readFileSync } from "node:fs";
import path from "node:path";

/** Serves the one process-flow composition. The player reads ?vars= for labels. */
export function GET() {
  const html = readFileSync(
    path.join(process.cwd(), "hyperframes/process-flow/index.html"),
    "utf8"
  );
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
