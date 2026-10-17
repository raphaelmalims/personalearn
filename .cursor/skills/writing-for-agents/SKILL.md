---
name: writing-for-agents
description: Write or edit prompts, skills, and rules for coding agents so they stay short and concrete. Manual only; use when editing .cursor files or AGENTS.md.
disable-model-invocation: true
---

# Writing for agents

Every line is read on every run, so each line must change what the agent does.

## Rules

- One job per file. If the description needs "and", split it.
- Write the description as when to use it, in one sentence. For a skill with side effects, set `disable-model-invocation: true`.
- Use plain imperative verbs. Say what to do, with the exact command or path. Cut "should", "try to", and "make sure".
- Point to a file instead of copying it. Do not paste a rule that already lives in `AGENTS.md`, `.cursor/rules`, or `docs/`. A copy drifts.
- State each rule once. Put the strictest form in the one place that owns it.
- Name only commands that exist. Check them against `package.json` and `docs/testing.md`.
- Give a reason in a clause when a rule is not obvious. The agent then handles the edge case.
- Prefer a numbered loop for a procedure and a short list for constraints. Add an example only when prose is ambiguous.
- Keep a `SKILL.md` under about 2.5 KB. Move long reference material into a separate file and link it.
- Use `GLOSSARY.md` terms when that file exists.
- Leave commits, pushes, and merges to the human.

## Check before saving

1. Delete every line that restates another file.
2. Could a cheaper model follow it without asking? If not, add the missing path or command.
3. Run `wc -c` on the file and trim to the limit.

Credit: adapted from mattpocock/skills `writing-for-agents` (MIT).
