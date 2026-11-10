# SDLC writing standard (PersonaLearn)

Canonical headings for GitHub Issues and Linear issues. Fill those from [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/). PR bodies follow the `writing-prs` skill. `PSL-N` is a [Linear](https://linear.app/personalearn/team/PSL) id. Specs live in Notion.

**Issue examples:** [PSL-5](https://linear.app/personalearn/issue/PSL-5/reference-sdlc-label-vocabulary-do-not-delete), [GitHub issue #129](https://github.com/raphaelmalims/personalearn/issues/129).

Process rules live in `.cursor/rules/sdlc.mdc`.

---

## GitHub Bug report

Use the **Bug report** issue form. Required sections map to these headings in the saved issue body:

| Section | Notes |
|--------|--------|
| **Summary** | What is broken; include **root cause** when known (see #129) |
| **Environment** | Production / preview / local |
| **Steps to reproduce** | Numbered |
| **Expected / Actual behavior** | Clear contrast |
| **Severity** | P0 / P1 / P2 → Linear priority at triage |
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

## Linear issue description

Mirror the GitHub Issue content, plus this ready checklist. Do not repeat labels, priority, assignee, milestone, or estimate; those are Linear fields.

```markdown
## Ready checklist
- [ ] Notion spec linked
- [ ] Acceptance criteria defined
…

## Acceptance criteria
- [ ] …

## Spec
Link to the Notion spec
```

Copy **Severity** (bugs) into Linear **priority**. Keep the same `area-*` + `type-*` as GitHub.

### Linear comment trail (minimum)

| When | Comment includes |
|------|------------------|
| Branch created | `PSL-N`, branch name |
| PR opened | `PSL-N`, PR URL, **Preview URL**, labels, assignee, milestone |
| PR reviewed | `PSL-N`, verdict, PR URL, labels confirmed, test plan checked |
| Merged | `PSL-N`, PR URL, GitHub Issue closed |

---

## Pull request body

PR bodies follow the `writing-prs` skill: Summary, Test plan, one closing line. No metadata or risks sections.
