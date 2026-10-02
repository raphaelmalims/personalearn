<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PersonaLearn — always on

Never implement on `develop` or `main`. Fetch `origin/develop` and branch from that tip (or from the merged prerequisite). If this ticket already has a branch, check it out.

Branch name: `{feature|fix|chore|docs}/PSL-N-short-kebab-description`.

| Work | Prefix | Commit subject |
|------|--------|----------------|
| Feature | `feature/` | `feat: … (PSL-N)` |
| Bug | `fix/` | `fix: … (PSL-N)` |
| Chore | `chore/` | `chore: … (PSL-N)` |
| Docs | `docs/` | `docs: … (PSL-N)` |

The human approves commits and merges. The agent proposes the diff and a commit message, then waits. Do not commit, push, or merge until the human asks. A finished edit, a green test run, or an open pull request is not approval.

No secrets in code, in logs, or in pull requests. That includes `.env.local`, API keys, access tokens, passwords, and service-role credentials. If a command would print one, redact it before the output is pasted into a log, a screenshot, a chat, or a PR body.
