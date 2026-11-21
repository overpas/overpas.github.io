#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path


PROTECTED_NAMES = ("AGENTS.md", "CLAUDE.md")
PROTECTED_FILES = (".claude/settings.json", ".claude/settings.local.json")
PROTECTED_DIRS = (
    ".claude/agents",
    ".claude/skills",
    ".claude/hooks",
    ".claude/workflows",
    ".agents",
    ".skills",
    ".codex",
    ".claude-plugin",
)
PROTECTED_ANCESTORS = (".claude",)
MARKERS = PROTECTED_NAMES + PROTECTED_FILES + PROTECTED_DIRS
UNLOCK = "<command-name>/edit-guidelines</command-name>"
EDIT_TOOLS = {"Edit": "file_path", "Write": "file_path", "MultiEdit": "file_path", "NotebookEdit": "notebook_path"}
SEPARATORS = {";", "&&", "||", "|", "&", "|&", "(", ")"}
WRAPPERS = {"sudo", "env", "command", "nohup", "time", "nice", "xargs", "exec"}
WRITERS = {"mv", "rm", "touch", "truncate", "dd", "chmod", "chflags", "tee", "unlink", "rmdir", "mkdir"}
COPIERS = {"cp", "ln", "install", "rsync", "ditto"}
IN_PLACE = {"sed", "gsed", "perl"}
INTERPRETERS = {"python", "python3", "node", "ruby", "perl", "bash", "sh", "zsh", "osascript"}
GIT_WRITERS = {"mv", "rm", "restore", "checkout"}
PATCHERS = {"apply", "am"}
HEREDOC = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
    return 0


def blocked(what):
    return deny(f"{what} is a protected guideline file. Do not change it to fit the task: propose the change in chat, and the user runs /edit-guidelines to allow it")


class Resolver:

    def __init__(self, cwd):
        self.cwd = Path(cwd or ".")
        self.roots = {}

    def toplevel(self, directory):
        if directory not in self.roots:
            completed = subprocess.run(["git", "-C", str(directory), "rev-parse", "--show-toplevel"], capture_output=True, text=True)
            self.roots[directory] = Path(completed.stdout.strip()).resolve() if completed.returncode == 0 else None
        return self.roots[directory]

    def relative(self, target):
        path = (self.cwd / os.path.expanduser(target)).resolve()
        directory = path if path.is_dir() else path.parent
        while not directory.exists() and directory != directory.parent:
            directory = directory.parent
        root = self.toplevel(directory)
        if root is None or (root != path and root not in path.parents):
            return None
        return path.relative_to(root).as_posix() if root != path else ""

    def protected(self, target):
        relative = self.relative(target)
        if not relative:
            return False
        return (
            relative.rsplit("/", 1)[-1] in PROTECTED_NAMES
            or relative in PROTECTED_FILES
            or relative in PROTECTED_ANCESTORS
            or any(relative == directory or relative.startswith(directory + "/") for directory in PROTECTED_DIRS)
        )


def turn_starts(lines):
    for line in reversed(lines):
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        if not isinstance(entry, dict) or entry.get("type") != "user" or entry.get("isSidechain"):
            continue
        if "turnOrigin" in entry or "origin" in entry:
            yield entry


def main_transcript(path):
    if path.parent.name == "subagents":
        return path.parent.parent.with_suffix(".jsonl")
    return path


def unlocked(event):
    transcript = event.get("transcript_path")
    if not transcript:
        return False
    try:
        lines = main_transcript(Path(transcript)).read_text(encoding="utf-8").splitlines()
    except OSError:
        return False
    entry = next(turn_starts(lines), None)
    if entry is None or entry.get("isMeta"):
        return False
    if (entry.get("turnOrigin") or (entry.get("origin") or {}).get("kind")) != "human":
        return False
    return UNLOCK in json.dumps((entry.get("message") or {}).get("content"))


def edit_target(event, resolver):
    tool = event.get("tool_name")
    target = (event.get("tool_input") or {}).get(EDIT_TOOLS.get(tool, ""))
    if tool in EDIT_TOOLS and target and resolver.protected(target):
        return target
    return None


def without_heredocs(command):
    lines = command.split("\n")
    kept = []
    delimiters = []
    for line in lines:
        if delimiters:
            if line.strip() == delimiters[0]:
                delimiters.pop(0)
            continue
        kept.append(line)
        delimiters.extend(match.group(2) for match in HEREDOC.finditer(line))
    return "\n".join(kept)


def tokens(command):
    lexer = shlex.shlex(without_heredocs(command).replace("\n", " ; "), posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    return list(lexer)


def segments(words):
    segment = []
    for word in words:
        if word in SEPARATORS:
            if segment:
                yield segment
            segment = []
        else:
            segment.append(word)
    if segment:
        yield segment


def redirect_targets(segment):
    return [segment[index + 1] for index, word in enumerate(segment[:-1]) if ">" in word and set(word) <= set("<>&|0123456789")]


def program(segment):
    words = [word for word in segment if not (">" in word and set(word) <= set("<>&|0123456789"))]
    while words and ("=" in words[0] and not words[0].startswith("-") or words[0] in WRAPPERS):
        words = words[1:]
    if not words:
        return "", []
    return words[0].rsplit("/", 1)[-1], words[1:]


def path_arguments(arguments):
    return [argument.split("=", 1)[1] if argument.startswith(("of=", "--target-directory=")) else argument for argument in arguments if not argument.startswith("-") or argument.startswith("of=")]


def git_subcommand(arguments):
    index = 0
    while index < len(arguments) and arguments[index].startswith("-"):
        index += 2 if arguments[index] in ("-C", "-c") else 1
    return (arguments[index], arguments[index + 1:]) if index < len(arguments) else ("", [])


def mentions_marker(text):
    return any(marker in text for marker in MARKERS)


def patch_touches_protected(arguments, resolver):
    for argument in path_arguments(arguments):
        try:
            if mentions_marker((resolver.cwd / argument).read_text(encoding="utf-8", errors="replace")):
                return True
        except OSError:
            continue
    return False


def segment_target(segment, resolver):
    redirected = next((target for target in redirect_targets(segment) if resolver.protected(target)), None)
    if redirected:
        return redirected
    name, arguments = program(segment)
    if name in COPIERS:
        destinations = [argument.split("=", 1)[1] for argument in arguments if argument.startswith("--target-directory=")]
        destinations += [arguments[index + 1] for index, argument in enumerate(arguments[:-1]) if argument == "-t"]
        paths = path_arguments(arguments)
        destinations += paths[-1:]
        return next((argument for argument in destinations if resolver.protected(argument)), None)
    if name in WRITERS or (name in IN_PLACE and any(argument.startswith("-") and not argument.startswith("--") and "i" in argument or argument.startswith("--in-place") for argument in arguments)):
        return next((argument for argument in path_arguments(arguments) if resolver.protected(argument)), None)
    if name in INTERPRETERS and any(argument in ("-c", "-e") or argument.startswith("-") and argument[-1] in "ce" for argument in arguments):
        return next((argument for argument in arguments if mentions_marker(argument)), None)
    if name == "git":
        subcommand, rest = git_subcommand(arguments)
        if subcommand in GIT_WRITERS:
            return next((argument for argument in path_arguments(rest) if resolver.protected(argument)), None)
        if subcommand in PATCHERS and patch_touches_protected(rest, resolver):
            return "a patch with guideline files"
    if name == "patch" and (patch_touches_protected(arguments, resolver) or mentions_marker(" ".join(arguments))):
        return "a patch with guideline files"
    return None


def bash_target(event, resolver):
    command = (event.get("tool_input") or {}).get("command") or ""
    if event.get("tool_name") != "Bash" or not command:
        return None
    try:
        words = tokens(command)
    except ValueError:
        return "an unparsable command that names a guideline file" if mentions_marker(command) else None
    return next((target for target in (segment_target(segment, resolver) for segment in segments(words)) if target), None)


def main():
    try:
        event = json.loads(sys.stdin.read())
    except ValueError:
        return 0
    if not isinstance(event, dict):
        return 0
    resolver = Resolver(event.get("cwd"))
    target = edit_target(event, resolver) or bash_target(event, resolver)
    if target is None or unlocked(event):
        return 0
    return blocked(target)


if __name__ == "__main__":
    raise SystemExit(main())
