import contextlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


_GUARD = Path(__file__).resolve().parents[2] / ".claude/hooks/guidelines-guard.py"
_UNLOCK = "<command-message>edit-guidelines</command-message>\n<command-name>/edit-guidelines</command-name>"


@contextlib.contextmanager
def _repo():
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory).resolve() / "repo"
        root.mkdir()
        subprocess.run(["git", "init", "-q", str(root)], check=True)
        yield root


def _guard(event):
    completed = subprocess.run(
        [sys.executable, str(_GUARD)],
        input=json.dumps(event) if isinstance(event, dict) else event,
        capture_output=True,
        text=True,
        timeout=60,
    )
    if not completed.stdout.strip():
        return None
    return json.loads(completed.stdout)["hookSpecificOutput"]["permissionDecision"]


def _write(path, cwd, transcript=None):
    event = {"tool_name": "Write", "tool_input": {"file_path": str(path), "content": "x"}, "cwd": str(cwd)}
    if transcript:
        event["transcript_path"] = str(transcript)
    return event


def _bash(command, cwd):
    return {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": str(cwd)}


def _prompt(content, origin="human"):
    return {"type": "user", "turnOrigin": origin, "origin": {"kind": origin}, "message": {"role": "user", "content": content}}


def _tool_result():
    return {"type": "user", "message": {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "t", "content": "ok"}]}}


def _skill_body():
    return {"type": "user", "isMeta": True, "message": {"role": "user", "content": [{"type": "text", "text": "Base directory for this skill"}]}}


def _transcript(root, *entries, name="session.jsonl"):
    path = root.parent / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(entry) + "\n" for entry in entries))
    return path


class EditToolTests(unittest.TestCase):

    def test_write_to_each_protected_path_is_denied(self):
        with _repo() as root:
            targets = [
                "AGENTS.md",
                "CLAUDE.md",
                "feature/CLAUDE.md",
                ".claude/agents/coder.md",
                ".claude/skills/new/SKILL.md",
                ".claude/hooks/guidelines-guard.py",
                ".claude/workflows/feature-build.js",
                ".claude/settings.json",
                ".claude/settings.local.json",
                ".agents/skills/x/SKILL.md",
                ".skills/x/SKILL.md",
                ".codex/agents/coder.toml",
                ".claude-plugin/marketplace.json",
            ]

            results = [_guard(_write(root / target, root)) for target in targets]

            self.assertEqual(["deny"] * len(targets), results)

    def test_write_to_a_normal_file_passes(self):
        with _repo() as root:

            result = _guard(_write(root / "src/blog/2026-03-14-post.md", root))

            self.assertIsNone(result)

    def test_relative_path_resolves_against_the_cwd(self):
        with _repo() as root:

            result = _guard({"tool_name": "Edit", "tool_input": {"file_path": "AGENTS.md"}, "cwd": str(root)})

            self.assertEqual("deny", result)

    def test_code_in_a_nested_worktree_passes(self):
        with _repo() as root:
            worktree = root / ".claude/worktrees/x"
            worktree.mkdir(parents=True)
            subprocess.run(["git", "init", "-q", str(worktree)], check=True)

            result = _guard(_write(worktree / "src/A.kt", root))

            self.assertIsNone(result)

    def test_guideline_files_in_a_nested_worktree_are_denied(self):
        with _repo() as root:
            worktree = root / ".claude/worktrees/x"
            worktree.mkdir(parents=True)
            subprocess.run(["git", "init", "-q", str(worktree)], check=True)

            results = [_guard(_write(worktree / target, worktree)) for target in ("AGENTS.md", ".claude/skills/a/SKILL.md")]

            self.assertEqual(["deny", "deny"], results)

    def test_write_outside_a_repository_passes(self):
        with tempfile.TemporaryDirectory() as directory:

            result = _guard(_write(Path(directory) / "AGENTS.md", directory))

            self.assertIsNone(result)

    def test_unreadable_input_passes(self):

        result = _guard("not json")

        self.assertIsNone(result)


class BashTests(unittest.TestCase):

    def test_writing_commands_on_protected_paths_are_denied(self):
        with _repo() as root:
            (root / "fix.patch").write_text("--- a/AGENTS.md\n+++ b/AGENTS.md\n")
            commands = [
                "echo x > AGENTS.md",
                "echo x >>CLAUDE.md",
                "cat <<'EOF' > AGENTS.md\nnew rule\nEOF",
                "printf x | tee -a .claude/agents/coder.md",
                "sed -i '' 's/a/b/' CLAUDE.md",
                "perl -pi -e 's/a/b/' AGENTS.md",
                "cp /tmp/x .claude/agents/b.md",
                "mv .claude/skills/a .claude/skills/b",
                "rm -rf .claude/skills",
                "rm -rf .claude",
                "touch .agents/skills/x/SKILL.md",
                "dd if=/dev/null of=AGENTS.md",
                "python3 -c \"open('AGENTS.md', 'w').write('x')\"",
                "git checkout -- AGENTS.md",
                "git -C . rm .claude/agents/demo.md",
                "git apply fix.patch",
                "cd /tmp && FOO=1 echo x > " + str(root / "CLAUDE.md"),
            ]

            results = {command: _guard(_bash(command, root)) for command in commands}

            self.assertEqual({command: "deny" for command in commands}, results)

    def test_reading_and_committing_commands_pass(self):
        with _repo() as root:
            commands = [
                "cat AGENTS.md",
                "grep -n rule CLAUDE.md .claude/skills/*/SKILL.md",
                "git diff -- AGENTS.md",
                "git add AGENTS.md .claude/skills",
                "git commit -m \"update AGENTS.md -> x\"",
                "git commit -F - <<'EOF'\nDon't touch CLAUDE.md\nEOF",
                "cp .claude/agents/coder.md /tmp/coder.md",
                "git checkout develop",
                "echo x > build/out.txt 2>&1",
                "rm -rf .claude/worktrees/x",
                "python3 -m unittest scripts/tests/test_guidelines_guard.py",
            ]

            results = {command: _guard(_bash(command, root)) for command in commands}

            self.assertEqual({command: None for command in commands}, results)


class UnlockTests(unittest.TestCase):

    def test_edit_guidelines_turn_unlocks(self):
        with _repo() as root:
            transcript = _transcript(root, _prompt("hi"), _prompt(_UNLOCK), _skill_body(), _tool_result())

            result = _guard(_write(root / "AGENTS.md", root, transcript))

            self.assertIsNone(result)

    def test_next_user_prompt_locks_again(self):
        with _repo() as root:
            transcript = _transcript(root, _prompt(_UNLOCK), _tool_result(), _prompt([{"type": "text", "text": "now fix the bug"}]))

            result = _guard(_write(root / "AGENTS.md", root, transcript))

            self.assertEqual("deny", result)

    def test_a_turn_that_no_human_started_stays_locked(self):
        with _repo() as root:
            transcript = _transcript(root, _prompt(_UNLOCK), _prompt(_UNLOCK, origin="task_notification"))

            result = _guard(_write(root / "AGENTS.md", root, transcript))

            self.assertEqual("deny", result)

    def test_a_subagent_uses_the_main_session_transcript(self):
        with _repo() as root:
            _transcript(root, _prompt(_UNLOCK))
            subagent = _transcript(root, {"type": "user", "isSidechain": True, "message": {"role": "user", "content": "go"}}, name="session/subagents/agent-a.jsonl")

            result = _guard(_write(root / "AGENTS.md", root, subagent))

            self.assertIsNone(result)

    def test_a_missing_transcript_stays_locked(self):
        with _repo() as root:

            result = _guard(_write(root / "AGENTS.md", root, root / "missing.jsonl"))

            self.assertEqual("deny", result)


if __name__ == "__main__":
    unittest.main()
