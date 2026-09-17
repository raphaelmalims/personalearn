## Summary

Write **prose** (not bullets-only): what changed, **why**, and root cause when fixing a bug. Name files or behaviors where it helps reviewers. Reference the GitHub Issue and related tickets (e.g. PSL-104 follow-up).

Example quality: [PR #130](https://github.com/raphaelmalims/personalearn/pull/130).

## Test plan

Check each box **after** the step is actually run. Do **not** Approve or merge while any item is still `[ ]` unless it is marked **N/A — {reason}**.

- [ ] `npm run lint`
- [ ] `npm test` (or ticket-specific suite, e.g. `vitest run src/lib/...`)
- [ ] `npm run build`
- [ ] Manual: _(steps specific to this ticket — copy from Jira ACs)_
- [ ] Preview URL verified: _(Vercel preview link, if applicable)_

## Links

- Jira: [PSL-__](https://nervustechnologies.atlassian.net/browse/PSL-__)
- GitHub Issue: #__

## Labels / metadata (required before review)

Set on the PR to match the Jira ticket:

- **Area (one):** `area-auth` | `area-dashboard` | `area-classes` | `area-ai-rag` | `area-infra` | `area-docs`
- **Type (one):** `type-feature` | `type-bug` | `type-chore` | `type-tech-debt`
- **Assignee:** `nervustech` (or the owner of the work)
- **Milestone:** current sprint, or **Backlog** if unscheduled
- **Reviewer:** request someone other than the author when a collaborator exists (solo-dev: post a review comment with verdict per `sdlc-pr-lifecycle`)

## Risks / notes

Optional: risk areas, rollout notes, follow-up tickets (`PSL-__`), screenshots or recordings if UI changed.
