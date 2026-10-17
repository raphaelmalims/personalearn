---
name: tdd
description: Test-driven development when the user asks for TDD or a failing test, or a bug has a cheap local test. Skip when the test path is unclear or expensive.
disable-model-invocation: true
---

# TDD

Use this when the user asks for TDD, a failing test, or a regression test, or when a bug has an obvious cheap local test. Skip when the path is unclear, expensive, integration-heavy, or needs a teacher session, Playwright, or Supabase. Prefer no new test over a bad one.

## Commands

From `package.json` and `docs/testing.md`:

- `npm test` runs Vitest unit and integration (`src/**/*.test.ts`). It needs no Supabase network and is the CI test step.
- `npm test -- src/path/to/file.test.ts` runs one file.
- `npm run test:e2e` is Playwright. Without E2E credentials it covers the auth gate only, and it is not in the default CI job.
- CI also runs `npm run lint` and `npm run build`.

## Loop

1. State the intended behavior, the current behavior, and the smallest reproduction.
2. Pick the narrowest existing Vitest path. If none is practical, do not invent a harness. Use the closest check and say why there is no failing-before test.
3. Write the smallest test that encodes the intended behavior. Run it and confirm it fails for that reason.
4. Change only enough production code to pass. Rerun that test. Run `npm test` when the change reaches beyond one file.

One behavior, one test, one implementation. Do not write the suite first and the code after.

## Anti-patterns

- **Implementation-coupled.** The test mocks an internal collaborator, calls a private method, or checks a side channel. It fails on a refactor when the behavior did not change.
- **Tautological.** The assertion recomputes the result the way the code does, so it cannot disagree. Expected values come from a literal, a worked example, or the spec.
- **Horizontal slicing.** Writing every test, then every implementation, locks in imagined behavior. One vertical slice at a time.

Do not edit a test so it matches a wrong implementation. Do not weaken an assertion unless the intended behavior changed.

In the reply, name the failing-before result and the passing-after run. Leave commits, pushes, and merges to the user.

Credit: adapted from poteto/pstack `tdd` and mattpocock/skills `tdd` (both MIT).
