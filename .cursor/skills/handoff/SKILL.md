---
name: handoff
description: Write a compact handoff note so a fresh agent or session can continue the work. Manual only.
disable-model-invocation: true
---

# Handoff

Write a note the next agent can act on cold. Do not write a transcript.

Save it to `/tmp/handoff-<PSL-N or topic>.md` unless the user names a path. Do not put it in the repo or commit it.

Sections, in order. Drop one that has nothing to say.

1. **Goal.** One or two sentences. Include the `PSL-N`, the Issue number, the branch, and the PR URL when they exist.
2. **State.** What is done and verified, and what is done but not verified. Say which is which.
3. **Decisions.** Choices made and the reason in a clause each, so they are not reopened.
4. **Next step.** The single next action, specific enough to start without questions.
5. **Open risks.** Unknowns, flaky checks, things you did not look at.
6. **Commands.** The exact commands to resume, such as `git switch <branch>` and `npm test -- <path>`, with the last result of each.

Link to the Issue, Jira ticket, PR, and files instead of copying them. Do not repeat what the diff or the Issue already says. Name files by path. Keep the note under 1 KB when you can.

No secrets, tokens, or user data in the note.

Print the file path and the note. Leave commits, pushes, and merges to the user.

Credit: adapted from mattpocock/skills `handoff` (MIT).
