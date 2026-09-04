"""Pin the packaging contracts: what the installers must ship, and what they name.

Two lists decide whether a downloaded payload is usable — ``KIT_REQUIRED_FILES`` in
``scripts/remote.sh`` and ``$script:KitRequiredFiles`` in ``scripts/remote.ps1``. A
shipped script whose sibling import is absent from those lists still passes the
post-fetch check and then fails at run time on the operator's machine, so the lists
are compared against the real import closure of the scripts they name, not eyeballed.

The installer's ``--only`` vocabulary is pinned the same way: every skill it offers
must exist on disk, and every skill the Aside channel walks must be offerable.
"""

import ast
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from dataclasses import dataclass
from pathlib import Path
from typing import FrozenSet, Iterable, Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

from harness import REPO, read, skill_dirs  # noqa: E402

REMOTE_SH: Path = REPO / "scripts" / "remote.sh"
REMOTE_PS1: Path = REPO / "scripts" / "remote.ps1"
INSTALL_SH: Path = REPO / "scripts" / "install.sh"
UNINSTALL_SH: Path = REPO / "scripts" / "uninstall.sh"
TEST_SH: Path = REPO / "scripts" / "test.sh"
ASIDE_LIB: Path = REPO / "scripts" / "aside" / "lib.sh"

SHELL_REQUIRED_VAR: str = "KIT_REQUIRED_FILES"
POWERSHELL_REQUIRED_VAR: str = "KitRequiredFiles"
ASIDE_SKILL_NAMES_VAR: str = "SKILL_NAMES"

# ``--only`` tokens that name a channel, an agent home, or a group — not a skill
# directory. Everything else in the vocabulary must be a ``skill/<name>/``.
NON_SKILL_ONLY_ITEMS: FrozenSet[str] = frozenset(
    ("aside", "agents", "browser-use", "claude", "codex", "grok", "hermes")
)

# Cleared before a plan run so the installer sees only the throwaway HOME.
OVERRIDE_ENV_NAMES: FrozenSet[str] = frozenset(
    ("ASIDE_SKILLS", "ASIDE_SKILLS_USER", "ASIDE_ACCOUNT", "CLAUDE_SKILLS")
)

# Plan-row labels that mean "this skill gets installed" (install.sh, render_plan).
INSTALL_ROW = re.compile(
    r"^\s{2}(copy|copy \(refresh\)|copy \(force\)|link|link \(force\)|install driver)\s{2,}(\S.*)$"
)
MISSING_PARENT_ROW = re.compile(r"^\s{2}parent missing\s{2,}(~/\S+)\s*$")

SHELL_REFERENCE = re.compile(r"^\$\{(\w+)\}$")
POWERSHELL_TOKEN = re.compile(r"'([^']*)'|\$script:(\w+)")
CASE_ARM = re.compile(r"^([a-z0-9|_ -]+)\)")
USAGE_TOKEN = re.compile(r"[a-z][a-z0-9-]*")


@dataclass(frozen=True)
class Installer:
    """One installer and the required-file list it declares."""

    path: Path
    label: str

    @property
    def relative(self) -> str:
        return self.path.relative_to(REPO).as_posix()


INSTALLERS: Tuple[Installer, ...] = (
    Installer(REMOTE_SH, "remote.sh"),
    Installer(REMOTE_PS1, "remote.ps1"),
)


def _shell_assignment(text: str, name: str) -> Optional[str]:
    """The raw body of a ``NAME="…"`` assignment, or ``None`` when absent."""
    match = re.search(r'^' + re.escape(name) + r'="([^"]*)"', text, re.MULTILINE)
    return None if match is None else match.group(1)


def _shell_list(text: str, name: str, seen: FrozenSet[str] = frozenset()) -> Tuple[str, ...]:
    """Expand a whitespace-separated shell list, following ``${OTHER_VAR}`` refs."""
    if name in seen:
        return ()
    body = _shell_assignment(text, name)
    if body is None:
        return ()
    entries: Tuple[str, ...] = ()
    for token in body.split():
        reference = SHELL_REFERENCE.match(token)
        if reference is None:
            entries = entries + (token,)
        else:
            entries = entries + _shell_list(text, reference.group(1), seen | {name})
    return entries


def _powershell_expression(text: str, name: str) -> Optional[str]:
    """The right-hand side of a ``$script:Name = …`` assignment, parens balanced."""
    match = re.search(r"^\$script:" + re.escape(name) + r"\s*=\s*", text, re.MULTILINE)
    if match is None:
        return None
    depth = 0
    for index in range(match.end(), len(text)):
        char = text[index]
        if char == "(":
            depth = depth + 1
        elif char == ")":
            depth = depth - 1
        elif char == "\n" and depth <= 0:
            return text[match.end() : index]
    return text[match.end() :]


def _powershell_list(
    text: str, name: str, seen: FrozenSet[str] = frozenset()
) -> Tuple[str, ...]:
    """Expand a PowerShell array literal, following ``$script:Other`` refs."""
    if name in seen:
        return ()
    expression = _powershell_expression(text, name)
    if expression is None:
        return ()
    entries: Tuple[str, ...] = ()
    for match in POWERSHELL_TOKEN.finditer(expression):
        literal, reference = match.group(1), match.group(2)
        if reference is None:
            entries = entries + (literal,)
        else:
            entries = entries + _powershell_list(text, reference, seen | {name})
    return entries


def required_files(path: Path) -> Tuple[str, ...]:
    """Every repo path one installer's required-file list declares, in order,
    normalized to forward slashes. Handles both the .sh and .ps1 forms."""
    text = read(path)
    if path.suffix == ".ps1":
        entries = _powershell_list(text, POWERSHELL_REQUIRED_VAR)
    else:
        entries = _shell_list(text, SHELL_REQUIRED_VAR)
    return tuple(entry.replace("\\", "/") for entry in entries)


def local_imports(path: Path) -> FrozenSet[str]:
    """Sibling modules `path` imports, found with ast.parse — never by importing.

    Each is returned as a repo-relative posix path, so a closure can chain them.
    """
    tree = ast.parse(read(path))
    found = set()
    for node in ast.walk(tree):
        candidates: Tuple[str, ...] = ()
        if isinstance(node, ast.Import):
            candidates = tuple(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                candidates = (node.module.split(".")[0],)
            else:
                candidates = tuple(alias.name for alias in node.names)
        for candidate in candidates:
            sibling = path.parent / (candidate + ".py")
            if sibling.is_file():
                found.add(sibling.relative_to(REPO).as_posix())
    return frozenset(found)


def import_closure(roots: Iterable[str]) -> FrozenSet[str]:
    """Every repo path transitively reachable from `roots` through local imports.

    The roots themselves are part of the closure; non-Python roots contribute
    nothing further.
    """
    pending = list(roots)
    reached = set()
    while pending:
        current = pending.pop()
        if current in reached:
            continue
        reached.add(current)
        path = REPO / current
        if path.suffix == ".py" and path.is_file():
            pending.extend(local_imports(path))
    return frozenset(reached)


def frontmatter_name(text: str) -> Optional[str]:
    """The ``name:`` field of a SKILL.md YAML frontmatter block, or ``None``."""
    if not text.startswith("---"):
        return None
    _, _, rest = text.partition("\n")
    body, _, _ = rest.partition("\n---")
    for line in body.splitlines():
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip().strip("'\"")
    return None


def only_case_vocabulary(text: str) -> Tuple[str, ...]:
    """The ``--only`` tokens ``expand_only``'s case statement accepts, in order."""
    start = text.find("expand_only() {")
    opening = text.find('case "${tok}" in', start)
    if start < 0 or opening < 0:
        return ()
    region = text[opening : text.find("esac", opening)]
    entries: Tuple[str, ...] = ()
    for line in region.splitlines():
        arm = CASE_ARM.match(line.strip())
        if arm is None:
            continue
        for token in arm.group(1).split("|"):
            stripped = token.strip()
            if stripped:
                entries = entries + (stripped,)
    return entries


def only_usage_vocabulary(text: str) -> Tuple[str, ...]:
    """The ``--only`` tokens the usage text advertises, in order."""
    entries: Tuple[str, ...] = ()
    collecting = False
    for line in text.splitlines():
        if "--only LIST" in line:
            collecting = True
            continue
        if not collecting:
            continue
        tokens = tuple(token.strip() for token in line.strip().split("|"))
        if len(tokens) < 2 or not all(USAGE_TOKEN.fullmatch(t) for t in tokens):
            break
        entries = entries + tokens
    return entries


def plan_installs(output: str) -> FrozenSet[str]:
    """Skill names an ``install.sh --dry-run`` plan marks for installation."""
    names = set()
    for line in output.splitlines():
        row = INSTALL_ROW.match(line)
        if row is None:
            continue
        for name in row.group(2).split(","):
            stripped = name.strip()
            if stripped:
                names.add(stripped)
    return frozenset(names)


def plan_missing_parents(output: str) -> Tuple[str, ...]:
    """Home-relative directories a plan reported missing, in order."""
    parents: Tuple[str, ...] = ()
    for line in output.splitlines():
        row = MISSING_PARENT_ROW.match(line)
        if row is not None:
            parents = parents + (row.group(1)[2:],)
    return parents


class RequiredFilesTests(unittest.TestCase):
    """The payload both installers verify after fetch."""

    @classmethod
    def setUpClass(cls):
        cls.declared = {
            installer.label: required_files(installer.path) for installer in INSTALLERS
        }

    def test_lists_are_parsed(self):
        for installer in INSTALLERS:
            with self.subTest(installer=installer.label):
                entries = self.declared[installer.label]
                self.assertTrue(
                    entries, "parsed no required files from %s" % installer.relative
                )
                self.assertIn("scripts/install.sh", entries)

    def test_declared_paths_exist(self):
        for installer in INSTALLERS:
            for entry in self.declared[installer.label]:
                with self.subTest(installer=installer.label, path=entry):
                    self.assertTrue(
                        (REPO / entry).is_file(),
                        "%s declares %s, which is not a regular file"
                        % (installer.relative, entry),
                    )

    def test_shell_installer_is_executable(self):
        self.assertTrue(
            REMOTE_SH.stat().st_mode & 0o111,
            "scripts/remote.sh must remain directly executable",
        )

    def test_installers_declare_the_same_sequence(self):
        shell, powershell = (self.declared[i.label] for i in INSTALLERS)
        difference = set(shell) ^ set(powershell)
        self.assertEqual(
            shell,
            powershell,
            "remote.sh and remote.ps1 required-file lists differ; "
            "symmetric difference: %s" % sorted(difference),
        )

    def test_required_scripts_are_import_closed(self):
        for installer in INSTALLERS:
            entries = self.declared[installer.label]
            declared = frozenset(entries)
            for entry in entries:
                if not entry.endswith(".py"):
                    continue
                with self.subTest(installer=installer.label, script=entry):
                    undeclared = sorted(import_closure((entry,)) - declared)
                    self.assertEqual(
                        undeclared,
                        [],
                        "%s ships %s but never declares what it imports: %s"
                        % (installer.relative, entry, undeclared),
                    )


class SkillLayoutTests(unittest.TestCase):
    """What a skill directory must look like, and what the installer may name."""

    @classmethod
    def setUpClass(cls):
        cls.install_text = read(INSTALL_SH)
        cls.names = tuple(directory.name for directory in skill_dirs())

    def test_every_skill_dir_has_a_skill_md(self):
        for directory in skill_dirs():
            with self.subTest(skill=directory.name):
                self.assertTrue(
                    (directory / "SKILL.md").is_file(),
                    "skill/%s/ ships no SKILL.md" % directory.name,
                )

    def test_frontmatter_name_matches_directory(self):
        for directory in skill_dirs():
            with self.subTest(skill=directory.name):
                declared = frontmatter_name(read(directory / "SKILL.md"))
                self.assertEqual(
                    declared,
                    directory.name,
                    "skill/%s/SKILL.md declares name: %r" % (directory.name, declared),
                )

    def test_install_only_vocabulary_matches_skill_dirs(self):
        from_case = only_case_vocabulary(self.install_text)
        from_usage = only_usage_vocabulary(self.install_text)
        self.assertTrue(from_case, "parsed no --only case arms from scripts/install.sh")
        self.assertTrue(from_usage, "parsed no --only usage tokens from scripts/install.sh")
        self.assertEqual(
            set(from_case),
            set(from_usage),
            "install.sh --only case arms and usage text disagree; "
            "symmetric difference: %s" % sorted(set(from_case) ^ set(from_usage)),
        )

        offered = frozenset(from_case) - NON_SKILL_ONLY_ITEMS
        for name in sorted(offered):
            with self.subTest(offered=name):
                self.assertIn(
                    name,
                    self.names,
                    "--only offers %s but there is no skill/%s/" % (name, name),
                )

        aside_names = _shell_list(read(ASIDE_LIB), ASIDE_SKILL_NAMES_VAR)
        self.assertTrue(aside_names, "parsed no SKILL_NAMES from scripts/aside/lib.sh")
        for name in aside_names:
            with self.subTest(aside_skill=name):
                self.assertIn(
                    name,
                    offered,
                    "the Aside channel installs %s but --only cannot select it" % name,
                )

    def test_resume_refine_implies_job_match(self):
        """Selecting job-resume-refine must also plan job-match.

        Driven, not pattern-matched: install.sh runs under --dry-run against a
        throwaway HOME and the plan it prints is the assertion, so the rule is
        checked as behavior rather than as a source string.
        """
        bash = shutil.which("bash")
        self.assertIsNotNone(bash, "bash is required to drive scripts/install.sh")
        command = [
            bash,
            str(INSTALL_SH),
            "--only",
            "job-resume-refine",
            "--dry-run",
            "--yes",
        ]
        with tempfile.TemporaryDirectory() as home:
            env = dict(os.environ)
            for name in OVERRIDE_ENV_NAMES:
                env.pop(name, None)
            env["HOME"] = home
            first = subprocess.run(
                command, cwd=home, env=env, capture_output=True, text=True, timeout=120
            )
            self.assertEqual(first.returncode, 0, first.stderr)
            output = first.stdout
            parents = plan_missing_parents(output)
            if parents:
                for parent in parents:
                    (Path(home) / parent).mkdir(parents=True, exist_ok=True)
                second = subprocess.run(
                    command, cwd=home, env=env, capture_output=True, text=True, timeout=120
                )
                self.assertEqual(second.returncode, 0, second.stderr)
                output = second.stdout

        planned = plan_installs(output)
        self.assertIn(
            "job-resume-refine",
            planned,
            "--only job-resume-refine planned nothing for itself:\n%s" % output,
        )
        self.assertIn(
            "job-match",
            planned,
            "--only job-resume-refine did not pull in job-match:\n%s" % output,
        )

    def test_job_prep_implies_job_scout(self):
        """Selecting job-prep must also plan job-apply and job-scout.

        flow-prep.md loads job-scout/references/contract-persistence.md at its
        liveness step and schema-plan.md binds job-scout's URL normalize, so a
        subset without job-scout cannot run. Driven the same way as the
        job-resume-refine rule above.
        """
        bash = shutil.which("bash")
        self.assertIsNotNone(bash, "bash is required to drive scripts/install.sh")
        command = [
            bash,
            str(INSTALL_SH),
            "--only",
            "job-prep",
            "--dry-run",
            "--yes",
        ]
        with tempfile.TemporaryDirectory() as home:
            env = dict(os.environ)
            for name in OVERRIDE_ENV_NAMES:
                env.pop(name, None)
            env["HOME"] = home
            first = subprocess.run(
                command, cwd=home, env=env, capture_output=True, text=True, timeout=120
            )
            self.assertEqual(first.returncode, 0, first.stderr)
            output = first.stdout
            parents = plan_missing_parents(output)
            if parents:
                for parent in parents:
                    (Path(home) / parent).mkdir(parents=True, exist_ok=True)
                second = subprocess.run(
                    command, cwd=home, env=env, capture_output=True, text=True, timeout=120
                )
                self.assertEqual(second.returncode, 0, second.stderr)
                output = second.stdout

        planned = plan_installs(output)
        for name in ("job-prep", "job-apply", "job-scout"):
            with self.subTest(planned=name):
                self.assertIn(
                    name,
                    planned,
                    "--only job-prep did not pull in %s:\n%s" % (name, output),
                )

    def test_uninstall_runtime_deps_mirror_install_closure(self):
        """uninstall.sh's guard table must carry the job-scout edge install.sh adds."""
        table = read(UNINSTALL_SH)
        start = table.index('ASIDE_RUNTIME_DEPS="') + len('ASIDE_RUNTIME_DEPS="')
        rows = table[start : table.index('"', start)].splitlines()
        deps = {row.split()[0]: set(row.split()[1:]) for row in rows if row.strip()}
        for dependent in ("job-prep", "job-apply"):
            with self.subTest(dependent=dependent):
                self.assertIn(
                    "job-scout",
                    deps.get(dependent, set()),
                    "scripts/uninstall.sh ASIDE_RUNTIME_DEPS row for %s lacks job-scout" % dependent,
                )


class TestRunnerTests(unittest.TestCase):
    def test_unknown_only_stage_is_rejected(self):
        completed = subprocess.run(
            ["sh", str(TEST_SH), "--only", "does-not-exist"],
            cwd=REPO,
            capture_output=True,
            text=True,
            timeout=30,
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("unknown stage 'does-not-exist'", completed.stderr)
        self.assertNotIn("all stages passed", completed.stdout)


if __name__ == "__main__":
    unittest.main()
