---
name: edit-guidelines
description: Allow edits to the protected guideline files (AGENTS.md, CLAUDE.md, .claude/agents/, .claude/skills/, .claude/hooks/, .claude/workflows/, .claude/settings*.json, .agents/, .skills/, .codex/, .claude-plugin/) for the rest of this turn. Only the user can run it.
argument-hint: "<the guideline change that the user wants>"
disable-model-invocation: true
---

# Edit guidelines

The user ran this command, so the guideline guard allows edits to the protected files until the
next user message. The change to make: $ARGUMENTS

## Rules

- Change only what the user asked for in this turn. If the request is not clear, ask before the
  edit.
- Use 1-3 sentences per entry: the rule, plus a short reason when the reason is not obvious.
- Never write in the first person. Use "the user", "the workspace" or the imperative.
- Add a new entry only if the current setup explicitly requires it, or if there are strong
  arguments that its absence will hinder or disrupt the project.
- Commit the change on the session branch in this turn. In the next turn the files are protected
  again.
