#!/usr/bin/env python3
"""Pin the CLI boundary of the shipped scripts against recorded JSON fixtures.

Each file in ``tests/golden`` is one case: the script to run, its argv, the JSON
written to stdin, and the exit code and parsed stdout the flows depend on. Every
case runs from ``cwd="/"`` so a relative-path regression cannot pass, and the
comparison is against *parsed* JSON rather than raw bytes, because a formatter
may rewrite the fixture files without changing their meaning.

Run ``python3 tests/test_golden.py --update`` to rewrite every fixture's ``exit``
and ``stdout`` from current behavior. Without that flag this file is an ordinary
unittest module, so ``unittest discover`` picks it up.
"""

import argparse
import json
import sys
import tempfile
import unittest
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

from harness import REPO, run_cli  # noqa: E402

GOLDEN: Path = Path(__file__).resolve().parent / "golden"
FIELDS: Tuple[str, ...] = ("script", "argv", "stdin", "exit", "stdout")

# check_parse.py: the fixture ``check_parse_shape_error`` sends a malformed
# expectation payload (``identity`` a string, not an array), which fails shape
# validation and returns before the script ever shells out. That branch is
# deterministic on any machine, so the suite never depends on whether pdftotext
# is installed.


def _fixture_object(path: Path) -> Dict[str, object]:
    """Read one fixture file, raising ValueError unless it is a JSON object."""
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError("{0}: unreadable fixture: {1}".format(path.name, error))
    if not isinstance(value, dict):
        raise ValueError("{0}: fixture must be an object".format(path.name))
    return value


def _script_path(path: Path, value: object) -> Path:
    """Resolve the fixture's repository-relative script path."""
    if not isinstance(value, str) or not value:
        raise ValueError("{0}: script must be a non-empty string".format(path.name))
    script = REPO / value
    if not script.is_file():
        raise ValueError("{0}: script does not exist: {1}".format(path.name, value))
    return script


def _argv(path: Path, value: object) -> Tuple[str, ...]:
    """Read the fixture's argv, defaulting to no arguments."""
    if value is None:
        return ()
    if not isinstance(value, list) or not all(
        isinstance(item, str) for item in value
    ):
        raise ValueError("{0}: argv must be an array of strings".format(path.name))
    return tuple(str(item) for item in value)


def _exit_code(path: Path, value: object) -> int:
    """Read the fixture's expected exit code."""
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("{0}: exit must be an integer".format(path.name))
    return value


@dataclass(frozen=True)
class GoldenCase:
    """One recorded CLI invocation and the boundary it pins."""

    path: Path
    script: Path
    argv: Tuple[str, ...]
    stdin: object
    exit_code: int
    stdout: object

    @property
    def name(self) -> str:
        return self.path.stem

    @property
    def relative_script(self) -> str:
        return self.script.relative_to(REPO).as_posix()

    @classmethod
    def from_json(cls, path: Path) -> "GoldenCase":
        """Parse one fixture, raising ValueError on a malformed field."""
        value = _fixture_object(path)
        unknown = sorted(set(value) - set(FIELDS))
        if unknown:
            raise ValueError(
                "{0}: unknown keys: {1}".format(path.name, ", ".join(unknown))
            )
        for required in ("script", "stdin", "exit", "stdout"):
            if required not in value:
                raise ValueError(
                    "{0}: missing key: {1}".format(path.name, required)
                )
        return cls(
            path=path,
            script=_script_path(path, value.get("script")),
            argv=_argv(path, value.get("argv")),
            stdin=value.get("stdin"),
            exit_code=_exit_code(path, value.get("exit")),
            stdout=value.get("stdout"),
        )

    def to_json(self) -> Dict[str, object]:
        """Return the fixture body in its canonical key order."""
        return {
            "script": self.relative_script,
            "argv": list(self.argv),
            "stdin": self.stdin,
            "exit": self.exit_code,
            "stdout": self.stdout,
        }


def fixture_paths() -> Tuple[Path, ...]:
    """Every fixture file, in sorted order."""
    return tuple(sorted(GOLDEN.glob("*.json")))


def cases() -> Tuple[GoldenCase, ...]:
    """Parse every fixture, in sorted order."""
    return tuple(GoldenCase.from_json(path) for path in fixture_paths())


def observed(case: GoldenCase) -> Tuple[int, object, bool, str]:
    """Run one case the way a flow does and return exit, stdout, parsed, stderr."""
    result = run_cli(case.script, payload=case.stdin, argv=case.argv, cwd="/")
    return result.exit_code, result.stdout, result.parsed, result.stderr


def rewritten(case: GoldenCase) -> GoldenCase:
    """Return the case with its exit code and stdout taken from current behavior."""
    exit_code, stdout, _parsed, _stderr = observed(case)
    return GoldenCase(
        path=case.path,
        script=case.script,
        argv=case.argv,
        stdin=case.stdin,
        exit_code=exit_code,
        stdout=stdout,
    )


def write(case: GoldenCase) -> None:
    """Write one fixture back to disk as formatted JSON."""
    body = json.dumps(case.to_json(), indent=2, ensure_ascii=False)
    case.path.write_text(body + "\n", encoding="utf-8")


def update() -> Tuple[str, ...]:
    """Regenerate every fixture's exit code and stdout; return the case names."""
    names: List[str] = []
    for case in cases():
        write(rewritten(case))
        names.append(case.name)
    return tuple(names)


class GoldenTests(unittest.TestCase):
    """Every case runs from cwd=/ so a relative-path regression cannot pass."""

    def test_fixtures_exist(self):
        self.assertTrue(fixture_paths(), "no fixtures under tests/golden")

    def test_cases_parse(self):
        for path in fixture_paths():
            with self.subTest(fixture=path.name):
                GoldenCase.from_json(path)

    def test_malformed_fixture_is_rejected(self):
        bodies = (
            "[]",
            "{}",
            '{"script": "", "stdin": null, "exit": 0, "stdout": null}',
            '{"script": "nope.py", "stdin": null, "exit": 0, "stdout": null}',
            '{"script": "tests/harness.py", "argv": [1],'
            ' "stdin": null, "exit": 0, "stdout": null}',
            '{"script": "tests/harness.py", "stdin": null,'
            ' "exit": true, "stdout": null}',
            '{"script": "tests/harness.py", "stdin": null,'
            ' "exit": 0, "stdout": null, "cwd": "/"}',
        )
        with tempfile.TemporaryDirectory() as directory:
            for index, body in enumerate(bodies):
                with self.subTest(body=body):
                    path = Path(directory) / "case{0}.json".format(index)
                    path.write_text(body, encoding="utf-8")
                    self.assertRaises(ValueError, GoldenCase.from_json, path)

    def test_golden_output(self):
        for case in cases():
            with self.subTest(case=case.name, script=case.relative_script):
                exit_code, stdout, parsed, stderr = observed(case)
                self.assertTrue(
                    parsed,
                    "stdout was not JSON; stderr: {0}".format(stderr),
                )
                self.assertEqual(case.stdout, stdout)
                self.assertEqual(case.exit_code, exit_code)


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Regenerate fixtures with --update, otherwise run the unittest module."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--update",
        action="store_true",
        help="rewrite every fixture's exit and stdout from current behavior",
    )
    known, rest = parser.parse_known_args(
        list(sys.argv[1:] if argv is None else argv)
    )
    if not known.update:
        unittest.main(argv=[sys.argv[0]] + rest)
        return 0
    for name in update():
        sys.stdout.write("updated {0}\n".format(name))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
