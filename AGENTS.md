# AGENTS.md

## General

### Do

- Use ASD-STE100.
- Be concise.
- When presenting any information to the user, when breaking it down, you should use 1-4 base
  elements/points. It pertains to explaining what you did, explaining different options to choose,
  or anything else. Any complex piece of information should consist of 1-4 root level elements,
  which in their turn can be expanded or broken down further, if prompted or required.
- Always start work in a new git branch from `main`, unless the user names another base branch.
  Obey "Git".
- Don't leave any files unstaged and uncommitted. Either stage and commit or add to `.gitignore` if
  it makes sense.

### Don't

- Write any comments in the code
- Add npm dependencies, a framework, a bundler or a client-side build step without explicit user
  request. The site is plain Eleventy output with vanilla CSS and JS.
- Describe or reference the concrete templates, files, filters, functions currently present in this
  project in docs. Refer to them as generic abstractions.

## Git

- Work only in a linked worktree under `.claude/worktrees/`, never in the main checkout. Parallel
  sessions in one checkout break each other's branches and uncommitted changes.
- If the session is in the main checkout, call `EnterWorktree` first. If it is already in a
  worktree, stay there and do not create a nested worktree.
- In the worktree, create a new branch from `main` (or the base branch that the user names):
  `git checkout -b <branch> main`.
- One branch per session, unless the user deviates from initial topic - in this case ask the user if
  you should continue working in the same branch or create a new one.
- At the end commit all the work. Keep the branch and report its name. Do not merge it, unless the
  user calls the branch-merging skill.
- Fixes, corrections, improvements belong in the same branch.
- At the end push the branch and open a pull request to the base branch. Never push to `main`;
  a push to `main` deploys the site to GitHub Pages.

## Verification

### L1: Build and lint

```shell
npm ci # once per new worktree, node_modules is not shared
npm run check # lint, build, HTML validation; must finish with no errors and no warnings
```

- Use `npm run fix` for errors that can be fixed automatically. Do not skip the pre-commit hook.
- CI also checks internal links and anchors in the built site, and the workflow files. Run these
  checks locally only if `lychee` or `actionlint` is installed.

### L2: Browser check

Required when a template, a stylesheet, a script, site data or content changes.

- Start the `site` preview server from `.claude/launch.json` and open every changed page.
- Check the browser console for errors.
- Check the light and the dark theme, and a phone width (375px) with no horizontal scroll.
- Check keyboard focus and accessible names when interactive elements change.

### L3: Scripts and hooks

Run when `scripts/` or `.claude/hooks/` change; they guard the verification tooling itself.

```shell
python3 -m unittest discover -s scripts/tests
```

## Guideline files

- AGENTS.md, CLAUDE.md, `.claude/agents/`, `.claude/skills/`, `.claude/hooks/`,
  `.claude/workflows/`, `.claude/settings*.json`, `.agents/`, `.skills/`, `.codex/` and
  `.claude-plugin/` are read-only for agents. A PreToolUse hook denies writes to them.
- Do not change a guideline to fit the task. When the code breaks a guideline, fix the code or ask
  the user.
- When a change sets a convention, propose the text in chat. The user runs `/edit-guidelines` to
  allow the edit for one turn.
