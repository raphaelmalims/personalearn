# SDLC writing standard (PersonaLearn)

Canonical headings for GitHub Issues, Jira tickets, and PRs. **Do not invent thinner formats** — fill from [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/) and [`.github/pull_request_template.md`](../.github/pull_request_template.md).

**Gold floor (examples):** [PSL-110](https://nervustechnologies.atlassian.net/browse/PSL-110), [GitHub issue #129](https://github.com/raphaelmalims/personalearn/issues/129), [PR #130](https://github.com/raphaelmalims/personalearn/pull/130).

Process rules live in `.cursor/rules/sdlc-ecosystem.mdc` and `.cursor/rules/git-workflow.mdc`.

---

## GitHub Bug report

Use the **Bug report** issue form. Required sections map to these headings in the saved issue body:

| Section | Notes |
|--------|--------|
| **Summary** | What is broken; include **root cause** when known (see #129) |
| **Environment** | Production / preview / local |
| **Steps to reproduce** | Numbered |
| **Expected / Actual behavior** | Clear contrast |
| **Severity** | P0 / P1 / P2 → Jira priority at triage |
| **Acceptance criteria** | `- [ ]` checklist |
| **Likely cause / notes** | Optional investigation / related tickets |

Labels on create: `needs-triage`, `type-bug`. Triage adds one `area-*`, milestone, and links `PSL-N`.

---

## GitHub Feature request

| Section | Notes |
|--------|--------|
| **Problem / opportunity** | Educator pain |
| **Proposed solution** | Desired behavior |
| **User value** | Why it matters |
| **Acceptance criteria** | `- [ ]` checklist |
| **Scope notes** | In scope vs later |
| **Out of scope / notes** | Optional exclusions |

Labels on create: `needs-triage`, `type-feature`.

---

## Jira ticket description

Mirror the GitHub Issue content, plus the ready checklist from `sdlc-ecosystem.mdc`:

```markdown
## Ready checklist
- [ ] Confluence spec linked
- [ ] Acceptance criteria defined
…

## Acceptance criteria
- [ ] …

## Spec
Link to PLEARN Confluence page (Product requirements blueprint)
```

Copy **Severity** (bugs) into Jira **priority**. Keep the same `area-*` + `type-*` as GitHub.

### Jira comment trail (minimum)

| When | Comment includes |
|------|------------------|
| Branch created | `PSL-N`, branch name |
| PR opened | `PSL-N`, PR URL, **Preview URL**, labels, assignee, milestone |
| PR reviewed | `PSL-N`, verdict, PR URL, labels confirmed, test plan checked |
| Merged | `PSL-N`, PR URL, GitHub Issue closed |

---

## Pull request body

Use [`.github/pull_request_template.md`](../.github/pull_request_template.md):

| Section | Notes |
|--------|--------|
| **Summary** | Prose: what + why + root cause for fixes |
| **Test plan** | Checkboxes; all `[x]` or N/A before merge |
| **Links** | Jira `PSL-N` + GitHub Issue `#` |
| **Labels / metadata** | area-*, type-*, assignee, milestone, reviewer |
| **Risks / notes** | Optional follow-ups |

See [PR #130](https://github.com/raphaelmalims/personalearn/pull/130) for tone and depth.
