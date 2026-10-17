---
name: writing-prs
description: Write or edit a pull request body or commit body. Use when opening or updating a pull request.
---

# Writing PRs

The body is a briefing. A reviewer with the diff should learn why the change exists, how you know it works, and what to watch.

Sections, in order. Drop one that has nothing to say.

1. `## Summary`: why and the approach in 2–5 sentences. Root cause for a bug. Plain verbs. Name a file or symbol only when it carries the change.
2. `## Test plan`: only what you ran, with the result. A skipped step is `N/A` plus a few words, never a paragraph.
3. Last line: `Closes #N · PSL-N`.

- Say each fact once.
- Labels, assignee, milestone, and reviewer are GitHub fields. Do not put them in the body.
- Do not list every file, control, state, or out-of-scope item. The diff is the inventory. A UI change gets one screenshot or one before/after line.
- No checkboxes for steps that do not apply.
- Add one `Risk:` sentence only for a one-way door (migration, data, auth) or a known follow-up.
- Target 600–1500 bytes. Past 2 KB, something is repeated or inventoried.
- Commit body: the why, two lines at most, no SHAs, and do not restate the subject.
- Use terms from `GLOSSARY.md` when that file exists.

Before opening or updating the PR, run `node scripts/pr-body-lint.mjs` on the body. Fix every FAIL. Fix warns you can. The script is advisory and does not block CI.

Credit: adapted from poteto/pstack `opening-a-pr` and mattpocock/skills `pr` (both MIT).
