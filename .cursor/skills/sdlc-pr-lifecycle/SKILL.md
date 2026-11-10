---
name: sdlc-pr-lifecycle
description: >-
  Delivery loop for a PersonaLearn PSL ticket: branch, open the PR, review, and
  merge. Use when implementing PSL-N, opening or reviewing a PR, or merging
  ticketed work. Policy is in `.cursor/rules/sdlc.mdc`.
---

# SDLC PR lifecycle

This file is the procedure. Branch names, human approval of commits and merges, labels, and the gates before approve or merge are in `.cursor/rules/sdlc.mdc`. Issue and Linear wording is in `docs/sdlc-writing-standard.md`. PR bodies follow the `writing-prs` skill. `PSL-N` is the [Linear](https://linear.app/personalearn/team/PSL) issue id. Specs live in Notion.

## Start

1. Read the Linear issue: summary, acceptance criteria, labels, priority, blockers, and the linked Notion spec.
2. Stop if a blocking prerequisite is not Done, unless the human overrides that stop.
3. If priority, estimate, or assignee is empty, fill it before branching.
4. Fetch `origin/develop`. Create `{feature|fix|chore|docs}/PSL-N-short-description` with the Linear number (a hotfix uses `hotfix/PSL-N-short-description`), or check out the issue’s branch if it already exists.
5. Move the Linear issue to **In Progress**.
6. Comment on the Linear issue: `PSL-N — branch created: {branch}`.

## Build

7. Implement and test. Propose each commit message and wait for the human to approve that commit. Keep the diff to this issue. The commit subject ends with `(PSL-N)`. The PR body includes `Fixes PSL-N`.

## Open the PR

8. Rebase onto `origin/develop`, push, and open a pull request into `develop`. Put `PSL-N` in the title. Write the body with the `writing-prs` skill.
9. Set area, type, assignee, milestone, and reviewer as `.cursor/rules/sdlc.mdc` requires. Copy any missing labels and the assignee back onto the Linear issue. Do not copy those fields into the PR body.
10. Move the Linear issue to **In Review**.
11. Comment on the Linear issue with `PSL-N`, the PR URL, the Vercel preview URL, labels, assignee, and milestone.
12. Post to Slack `#personalearn-dev`: `PSL-N — PR opened: {url} — {one line}`.

## Review

13. Wait until CI is green and the Vercel preview is healthy.
14. Run the Test plan and tick only the steps you actually ran. Walk every acceptance criterion and tick each met box on the GitHub Issue and on the Linear issue.
15. Do not approve, and do not ask for a merge, while a met criterion or a Test plan step is still unchecked. The rule is the gate.
16. Post a GitHub review that names `PSL-N`, the verdict, and that labels, assignee, milestone, the Test plan, and the issue checkboxes were checked.
17. Mirror that verdict on the Linear issue with the PR URL. Follow-up work becomes its own triaged issue.

## Merge

18. Stop. Ask the human to approve the merge.
19. After that approval, squash-merge into `develop` and delete the branch.
20. Close the GitHub Issue as completed. Move the Linear issue to **Done** (`Fixes PSL-N` does this when the PR merges). Comment `PSL-N — merged to develop: {url}` and the Issue URL.
21. Slack `#personalearn-dev`: `PSL-N — merged: {url} — {one line}`.

Shipping `develop` to `main` is a later merge commit. Ask the human first. Do not squash that promotion.

## Intake

An Issue that has no `PSL-N` yet gets `needs-triage`, a best-guess type, assignee `raphaelmalims`, and the current sprint milestone or Backlog. Use the `triage-issue` skill to link the Linear issue, copy labels and assignee onto Linear, remove `needs-triage`, and reply on the Issue with the `PSL-N` link.
