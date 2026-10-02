---
name: grill
description: Stress-test a plan in at most two rounds, then draft a GitHub Issue with acceptance criteria. Manual only; use the planning model.
disable-model-invocation: true
---

# Grill

Interview until you and the user share a design. Do not implement.

Map the idea as a design tree. The frontier is every decision whose prerequisites are already settled. Ask the whole frontier in one round. Number each question and give a recommended answer, so the user can reply "yes to all but Q3". Then wait. Two rounds maximum. A question that depends on an answer still open in this round waits for the next one.

```
Q1. Title

Body, including choices when they help.

Recommended: your answer, and why in one sentence.
```

Look up facts yourself in the repo and docs. Do not dispatch a sub-agent. Do not ask the user for anything you can read.

When the frontier is empty, or after two rounds, restate the decisions in a few sentences and wait for confirmation.

If the confirmed idea should become work, draft one GitHub Issue with checkbox acceptance criteria, using `docs/sdlc-writing-standard.md`. Intake stays the existing path: GitHub Issue, then `triage-issue` to link Jira `PSL-N`. Do not open another tracker or write ticket files.

If the idea is bigger than one reviewable change, add the slice list in that same draft:

- Each slice is a thin vertical cut through the layers it needs, and it is verifiable on its own.
- Each ticket names what blocks it, or "none".
- Each ticket has a done predicate: one command that passes or fails, usually `npm test` or `npm test -- <path>`.

The user approves the Issue text and any slice list. Leave commits, pushes, and merges to them.

Credit: adapted from mattpocock/skills `grilling` and `to-tickets` (MIT).
