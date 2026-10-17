---
name: review
description: Single-pass read-only review of a diff or PR that ends in a verdict and short findings. Manual only; use the planning model.
disable-model-invocation: true
---

# Review

Read the diff once and judge it. Never edit files, commit, push, or merge. Do not dispatch a sub-agent.

Get the diff yourself: the PR diff, or `git diff <base>...HEAD`. Read the Issue and its acceptance criteria. Read the surrounding code, not only the changed lines.

## Check

- **Correctness.** Does it do what the Issue asks? Look for edge cases, error paths, and wrong assumptions. Check the artifact, not a proxy: read the code that runs.
- **Tests.** Does a test fail without the change? Flag tautological or mock-only tests.
- **Scope.** Flag changes the Issue did not ask for. Prefer the smallest diff.
- **Size.** Flag a diff too big for one reviewable change.
- **Security.** Secrets, auth, RLS, unsanitised input, and user data in logs.
- **Conventions.** `AGENTS.md`, `.cursor/rules`, and `docs/`. Use `GLOSSARY.md` terms when it exists.
- **PR body.** Summary and Test plan, with nothing padded.

Run `npm run lint`, `npm test`, and `npm run build` only when asked. Otherwise cite the CI result.

## Output

```
Verdict: approve | changes requested | blocked

1. [blocker|major|nit] path:line. Problem in one sentence. Fix in one sentence.
```

Order findings by severity. Report only what you checked. Do not praise, summarise the diff, or invent findings to fill space. Post comments only if the user asks.

Credit: adapted from mattpocock/skills `code-review` and poteto/pstack `prove-it-works` (both MIT).
