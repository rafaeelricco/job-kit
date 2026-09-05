"""Exercise browser-channel ownership through isolated native installers.

Copies use the working tree, including new skills, without building an archive.
Only browser discovery and the external driver/CLI operations are stubbed.
"""

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from test_packaging import _powershell_list, _shell_list
from test_release import native_shells, shell_path

REPO = Path(__file__).resolve().parents[1]
SOLVER = "job-captcha-solver"

BASH_DRIVER = r'''#!/bin/sh
if [ "$#" -eq 5 ] && [ "$1" = skill ] && [ "$2" = install ] &&
   [ "$3" = --path ] && [ "$4" = "$BROWSER_TEST_DRIVER" ] &&
   [ "$5" = --no-install ]; then
  mkdir -p "$4" || exit 1
  printf '%s\n' 'fixture browser-use driver' > "$4/SKILL.md"
  exit 0
fi
echo "unexpected browser-use invocation: $*" >> "$BROWSER_TEST_ERRORS"
exit 97
'''

CMD_DRIVER = r'''@echo off
if not "%~1"=="skill" goto unexpected
if not "%~2"=="install" goto unexpected
if not "%~3"=="--path" goto unexpected
if not "%~4"=="%BROWSER_TEST_DRIVER%" goto unexpected
if not "%~5"=="--no-install" goto unexpected
if not "%~6"=="" goto unexpected
mkdir "%~4" || exit /b 1
echo fixture browser-use driver>"%~4\SKILL.md"
exit /b 0
:unexpected
echo unexpected browser-use invocation: %*>>"%BROWSER_TEST_ERRORS%"
exit /b 97
'''


class BrowserFixture:
    def __init__(self, root, shell):
        self.root = root
        self.kind, self.executable = shell
        self.kit = root / "cached kit"
        self.skills = root / "agent skills"
        self.aside = root / "aside skills"
        self.bin = root / "bin"
        self.errors = root / "unexpected-commands.log"
        for name in ("scripts", "skill"):
            shutil.copytree(REPO / name, self.kit / name,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "node_modules"))
        for path in (self.skills, self.aside, self.bin, root / "home",
                     root / "program files", root / "program files x86",
                     root / "localappdata", root / "config", root / "data"):
            path.mkdir(parents=True, exist_ok=True)
        self.stub("browser-use", BASH_DRIVER, CMD_DRIVER)
        self.stub("uv", r'''#!/bin/sh
if [ "$#" -eq 3 ] && [ "$1" = tool ] && [ "$2" = uninstall ] &&
   [ "$3" = browser-use ]; then exit 0; fi
echo "unexpected uv invocation: $*" >> "$BROWSER_TEST_ERRORS"
exit 97
''', r'''@echo off
if not "%~1"=="tool" goto unexpected
if not "%~2"=="uninstall" goto unexpected
if not "%~3"=="browser-use" goto unexpected
if not "%~4"=="" goto unexpected
exit /b 0
:unexpected
echo unexpected uv invocation: %*>>"%BROWSER_TEST_ERRORS%"
exit /b 97
''')
        # Discovery checks only command presence; running a browser is a bug.
        for name in ("google-chrome", "chromium"):
            self.stub(name, '#!/bin/sh\necho "unexpected browser invocation" >> "$BROWSER_TEST_ERRORS"\nexit 97\n',
                      '@echo off\necho unexpected browser invocation>>"%BROWSER_TEST_ERRORS%"\nexit /b 97\n')

    def stub(self, name, bash, cmd):
        path = self.bin / name
        with path.open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(bash)
        path.chmod(0o755)
        with (self.bin / (name + ".cmd")).open("w", encoding="utf-8", newline="\r\n") as stream:
            stream.write(cmd)

    def run(self, entrypoint, *args):
        excluded = {"HOME", "USERPROFILE", "CLAUDE_SKILLS", "ASIDE_SKILLS",
                    "BASH_ENV", "ENV", "PSMODULEPATH", "XDG_CONFIG_HOME",
                    "XDG_DATA_HOME", "LOCALAPPDATA", "APPDATA", "PROGRAMFILES",
                    "PROGRAMFILES(X86)"}
        env = {key: value for key, value in os.environ.items()
               if key.upper() not in excluded
               and not key.upper().startswith(("JOB_KIT_", "ASIDE_", "BROWSER_TEST_", "XDG_"))}
        paths = {
            "HOME": self.root / "home", "USERPROFILE": self.root / "home",
            "CLAUDE_SKILLS": self.skills, "ASIDE_SKILLS": self.aside,
            "JOB_KIT_HOME": self.kit, "XDG_CONFIG_HOME": self.root / "config",
            "XDG_DATA_HOME": self.root / "data", "APPDATA": self.root / "config",
            "LOCALAPPDATA": self.root / "localappdata",
            "ProgramFiles": self.root / "program files",
            "ProgramFiles(x86)": self.root / "program files x86",
            "BROWSER_TEST_DRIVER": self.skills / "browser-use",
            "BROWSER_TEST_ERRORS": self.errors,
        }
        env.update({key: shell_path(path, self.kind) for key, path in paths.items()})
        env["PATH"] = str(self.bin) + os.pathsep + os.environ.get("PATH", "")
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        suffix = ".sh" if self.kind == "bash" else ".ps1"
        script = self.kit / "scripts" / (entrypoint + suffix)
        if self.kind == "bash":
            if os.name == "nt":
                env["MSYS"] = "winsymlinks:nativestrict"
            command = [self.executable, shell_path(script, self.kind), *args]
        else:
            command = [self.executable, "-NoLogo", "-NoProfile", "-NonInteractive",
                       "-ExecutionPolicy", "Bypass", "-File", str(script), *args]
        return subprocess.run(command, cwd=self.root, env=env, input="",
                              capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=90)

    def names(self):
        return {path.name for path in self.skills.iterdir()}

    def link_solver(self):
        source = self.kit / "skill" / SOLVER
        dest = self.skills / SOLVER
        if os.name == "nt":
            subprocess.run(["cmd", "/c", "mklink", "/J", str(dest), str(source)],
                           check=True, capture_output=True)
        else:
            dest.symlink_to(source, target_is_directory=True)


class BrowserChannelTests(unittest.TestCase):
    def each_shell(self, scenario):
        shells = native_shells()
        self.assertTrue(shells, "no native installer shell found")
        for shell in shells:
            with self.subTest(shell=shell[0]), tempfile.TemporaryDirectory() as directory:
                fixture = BrowserFixture(Path(directory).resolve(), shell)
                try:
                    scenario(fixture)
                finally:
                    self.assertFalse(fixture.errors.exists(),
                                     fixture.errors.read_text() if fixture.errors.exists() else "")

    def success(self, result):
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_dry_runs_select_solver_only_for_browser(self):
        def scenario(f):
            before = sorted(str(path.relative_to(f.root)) for path in f.root.rglob("*"))
            browser = f.run("browser-use/install", "--dry-run")
            agents = f.run("agents/install", "--dry-run")
            self.success(browser)
            self.success(agents)
            self.assertIn(SOLVER, browser.stdout)
            self.assertNotIn(SOLVER, agents.stdout)
            self.assertEqual(f.names(), set())
            self.assertEqual(before, sorted(str(path.relative_to(f.root)) for path in f.root.rglob("*")))
        self.each_shell(scenario)

    def test_browser_only_cycle_removes_all_skills(self):
        def scenario(f):
            self.success(f.run("browser-use/install"))
            self.assertTrue((f.skills / SOLVER / "SKILL.md").is_file())
            self.assertEqual((f.skills / SOLVER).resolve(), (f.kit / "skill" / SOLVER).resolve())
            self.assertTrue((f.skills / "browser-use/SKILL.md").is_file())
            self.success(f.run("uninstall", "browser-use"))
            self.assertEqual(f.names(), set())
        self.each_shell(scenario)

    def test_agents_only_cycle_never_installs_solver(self):
        def scenario(f):
            self.success(f.run("agents/install"))
            self.assertNotIn(SOLVER, f.names())
            self.assertNotIn("browser-use", f.names())
            self.assertIn("job-profile-init", f.names())
            self.success(f.run("uninstall", "agents"))
            self.assertEqual(f.names(), set())
        self.each_shell(scenario)

    def test_browser_uninstall_preserves_only_agents_dependencies(self):
        def scenario(f):
            self.success(f.run("agents/install"))
            self.success(f.run("browser-use/install"))
            self.assertTrue((f.skills / SOLVER / "SKILL.md").is_file())
            before = f.names()
            preview = f.run("uninstall", "browser-use", "--dry-run")
            self.success(preview)
            self.assertIn(SOLVER, preview.stdout)
            self.assertNotIn("job-match", preview.stdout)
            self.assertEqual(f.names(), before)
            self.success(f.run("uninstall", "browser-use"))
            self.assertEqual(before - f.names(),
                             {SOLVER, "job-scout", "job-apply", "job-prep", "browser-use"})
            self.assertIn("job-match", f.names())
            self.assertIn("job-profile-init", f.names())
            self.success(f.run("uninstall", "agents"))
            self.assertEqual(f.names(), set())
        self.each_shell(scenario)

    def test_agents_removal_preserves_browser_dependencies(self):
        def scenario(f):
            self.success(f.run("agents/install"))
            self.success(f.run("browser-use/install"))
            self.success(f.run("uninstall", "agents"))
            self.assertIn(SOLVER, f.names())
            self.assertIn("job-match", f.names())
            self.assertIn("job-apply", f.names())
            self.assertNotIn("job-profile-init", f.names())
            self.success(f.run("uninstall", "browser-use"))
            self.assertEqual(f.names(), set())
        self.each_shell(scenario)

    def test_sole_solver_link_blocks_cache_purge(self):
        def scenario(f):
            f.link_solver()
            self.assertEqual(f.names(), {SOLVER})
            result = f.run("uninstall", "cache", "--dry-run")
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn(SOLVER, result.stdout + result.stderr)
            self.assertIn("installed skills point at", result.stdout + result.stderr)
            self.assertTrue(f.kit.is_dir())
            self.assertEqual(f.names(), {SOLVER})
        self.each_shell(scenario)


class BrowserDependencyTests(unittest.TestCase):
    def test_shell_lists_agree_and_solver_is_browser_exclusive(self):
        bash = (REPO / "scripts/agents/lib.sh").read_text(encoding="utf-8")
        powershell = (REPO / "scripts/agents/lib.ps1").read_text(encoding="utf-8")
        for sh_name, ps_name in (
            ("CORE_SKILL_NAMES", "CoreSkillNames"),
            ("SKILL_NAMES", "SkillNames"),
            ("BROWSER_SKILL_NAMES", "BrowserSkillNames"),
            ("BROWSER_SHARED_DEPS", "BrowserSharedDeps"),
            ("ALL_SKILL_NAMES", "AllSkillNames"),
        ):
            with self.subTest(list=sh_name):
                entries = _shell_list(bash, sh_name)
                self.assertTrue(entries)
                self.assertEqual(entries, _powershell_list(powershell, ps_name))
                self.assertNotIn("captcha-solver", entries)
                self.assertEqual(SOLVER in entries,
                                 sh_name in ("BROWSER_SHARED_DEPS", "ALL_SKILL_NAMES"))
        aside = (REPO / "scripts/aside/lib.sh").read_text(encoding="utf-8")
        self.assertNotIn(SOLVER, _shell_list(aside, "SKILL_NAMES"))
        self.assertNotIn("captcha-solver", _shell_list(aside, "SKILL_NAMES"))


if __name__ == "__main__":
    unittest.main()
