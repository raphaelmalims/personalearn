---
name: diagnose
description: Debug a reported bug or failing behavior with a reproduce, minimise, hypothesise, instrument, fix loop. Use when something is broken, failing, or behaves wrongly.
---

# Diagnose

Find the root cause before changing code. Do not guess-and-patch.

## Loop

1. **Reproduce.** Build the tightest pass/fail signal you can: a failing `npm test -- <path>`, a script, or exact steps. If you cannot reproduce it, say so and ask for the missing input. Do not fix what you cannot see.
2. **Minimise.** Remove inputs, steps, and code until the failure still happens and nothing extra remains.
3. **Hypothesise.** Write 3 to 5 ranked causes, each with the observation that would prove it wrong. Check the cheapest first.
4. **Instrument.** Add one log or assertion per hypothesis, run, and read the result. Change one thing at a time. Remove the instrumentation afterwards.
5. **Fix.** Fix the root cause, not the symptom. Make the smallest diff that does it.
6. **Regression-test.** Keep the reproduction as a test when `tdd` says a cheap local path exists. Run it failing before and passing after. Then run `npm test`.

## Rules

- Redact secrets, tokens, and user data from logs, output, and the reply.
- If two hypotheses fail in a row, stop and re-read the repro. The assumption is probably wrong.
- Do not weaken or delete a failing test to get green.
- Do not touch Supabase or production data to investigate. Use the dev project only when the user says so.
- Use terms from `GLOSSARY.md` when that file exists.

In the reply, give the cause in one sentence, the evidence, the fix, and the failing-before and passing-after runs. Leave commits, pushes, and merges to the user.

Credit: adapted from mattpocock/skills `diagnosing-bugs` and poteto/pstack `fix-root-causes` (both MIT).
