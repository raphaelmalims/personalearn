---
name: sdlc-pr-lifecycle
description: >-
  Delivery loop for a PersonaLearn PSL ticket: branch, open the PR, review, and
  merge. Use when implementing PSL-N, opening or reviewing a PR, or merging
  ticketed work. Policy is in `.cursor/rules/sdlc.mdc`.
---

# SDLC PR lifecycle

This file is the procedure. Branch names, human approval of commits and merges, labels, and the gates before approve or merge are in `.cursor/rules/sdlc.mdc`. Issue and Jira wording is in `docs/sdlc-writing-standard.md`. PR bodies follow the `writing-prs` skill.

## Start

Write an Issue or Jira description as the problem, the context, short acceptance criteria, and links that are not already linked. Leave labels, priority, assignee, milestone, sprint, points, and dates in their fields. Leave the PR test plan in the pull request and the merge gates in `.cursor/rules/sdlc.mdc`.

1. Read the Jira ticket: summary, acceptance criteria, labels, sprint, blockers, and the linked spec.
2. Stop if a blocking prerequisite is not Done, unless the human overrides that stop.
3. If Team, points, priority, start date, due date, or sprint is empty, fill it before branching.
4. Fetch `origin/develop`. Create `{feature|fix|chore|docs}/PSL-N-short-description`, or check out the ticket’s branch if it already exists.
5. Move Jira to **In Progress**. If the start date is empty, set it to today.
6. Comment on Jira: `PSL-N — branch created: {branch}`.

## Build

7. Implement and test. Propose each commit message and wait for the human to approve that commit. Keep the diff to this ticket.

## Open the PR

8. Rebase onto `origin/develop`, push, and open a pull request into `develop`. Put `PSL-N` in the title. Write the body with the `writing-prs` skill. In that same creation step, set assignee `raphaelmalims` when unset, the milestone (current sprint, otherwise `Backlog`), and the area and type labels, on the Cursor creation path that sets labels. Do not follow up with `gh pr edit` or `gh api` from the in-VM `cursor[bot]` (`ghs_`) token. It returns 403 `Resource not accessible by integration`. If a field cannot be set at creation, name it in the final report for the reviewer. Do not retry with `gh`.
9. Copy any missing labels and the assignee onto Jira. Request a reviewer other than the author only when another reviewer exists. If the only candidate is the author, skip the request.
10. Move Jira to **Review**.
11. Comment on Jira with `PSL-N`, the PR URL, the Vercel preview URL, labels, assignee, and milestone.
12. Post to Slack `#personalearn-dev`: `PSL-N — PR opened: {url} — {one line}`.

## Review

13. Wait until CI is green and the Vercel preview is healthy.
14. Run the Test plan and tick only the steps you actually ran. Walk every acceptance criterion and tick each met box on the GitHub Issue and on Jira.
15. Do not approve, and do not ask for a merge, while a met criterion or a Test plan step is still unchecked. The rule is the gate.
16. Post a GitHub review that names `PSL-N`, the verdict, and that labels, assignee, milestone, the Test plan, and the issue checkboxes were checked.
17. Mirror that verdict on Jira with the PR URL. Follow-up work becomes its own triaged ticket.

## Merge

18. Stop. Ask the human to approve the merge.
19. After that approval, squash-merge into `develop` and delete the branch.
20. Close the GitHub Issue as completed. Move Jira to **Done**. Comment `PSL-N — merged to develop: {url}` and the Issue URL.
21. Slack `#personalearn-dev`: `PSL-N — merged: {url} — {one line}`.

Shipping `develop` to `main` is a later merge commit. Ask the human first. Do not squash that promotion.

## Hotfix

Use this path, in place of steps 4 and 8, only when production is broken or at risk (a P1) and the fix should not wait behind unreleased work on `develop`. Otherwise use the steps above. Policy is in `.cursor/rules/sdlc.mdc`.

1. Fetch `origin/main`. Branch `hotfix/PSL-N-slug` from `main`.
2. Open the pull request into `main`, and set assignee, milestone, and labels in that same creation step (step 8). A merge to `main` deploys Vercel production, so run preview QA before asking for a merge.
3. Stop. A human approves the merge.
4. After the merge, open a back-merge pull request from `main` into `develop`, or cherry-pick the fix onto a branch from `develop`.

## Intake

An Issue that has no `PSL-N` yet is created with `needs-triage`, a best-guess type, assignee `raphaelmalims`, and the current sprint milestone or `Backlog`, in that same creation step on the Cursor path. Do not set those afterward with `gh`. Use the `triage-issue` skill to link the ticket, copy labels and assignee onto Jira, remove `needs-triage`, and reply on the Issue with the `PSL-N` link.
