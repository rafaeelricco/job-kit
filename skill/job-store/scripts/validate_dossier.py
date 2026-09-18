"""Validate a rendered dossier before commit.

Shape only: exactly the nine frontmatter keys the reader requires, closed
vocabularies for `status`, `bucket`, and `channel`, ISO days for `first_seen`
and `last_seen`, `score` an integer 0–10 or `—`, an http(s) `url`, and the
ownership marker on exactly one line.

stdin: ``{"paths": ["<file>", ...]}``.
stdout: ``{"dossiers": [{"path": ..., "errors": [...]}]}`` in the same order, or
``{"validate_error": "..."}`` with exit 1.
"""

import json
import re
import sys
from typing import Dict, List, Tuple

from validate_extract import HTTP_URL, UNKNOWN, real_day

KEYS: Tuple[str, ...] = (
    "company", "title", "url", "status", "first_seen", "last_seen", "score", "bucket", "channel",
)
STATUS: Tuple[str, ...] = ("new", "applied", "rejected", "interview", "offer", "dropped")
BUCKET: Tuple[str, ...] = ("direct", "EOR", "restricted-geo", "unbucketed")
CHANNEL: Tuple[str, ...] = ("ats", "direct_email", "dm_request", "founder")
MARKER = "<!-- scout never writes below this line -->"
SCORE = re.compile(r"^(?:10|[0-9])$")


def frontmatter(lines: List[str]) -> Tuple[Dict[str, str], List[str]]:
    if not lines or lines[0] != "---":
        return {}, ["frontmatter: no --- on line 1"]
    if "---" not in lines[1:]:
        return {}, ["frontmatter: unterminated"]
    fields: Dict[str, str] = {}
    errors: List[str] = []
    for line in lines[1:lines.index("---", 1)]:
        if not line.strip():
            continue
        key, sep, value = line.partition(": ")  # first ": " only, as the reader
        if not sep:
            errors.append("frontmatter: not `key: value`: {0}".format(line))
            continue
        quoted = len(value) >= 2 and value[0] == value[-1] == '"'
        fields[key] = value[1:-1] if quoted else value
    return fields, errors


def validate(text: str) -> List[str]:
    lines = text.splitlines()
    fields, errors = frontmatter(lines)
    errors += ["missing {0}".format(key) for key in KEYS if key not in fields]
    errors += ["unknown key {0}".format(key) for key in fields if key not in KEYS]
    checks = (
        ("status", fields.get("status") in STATUS, "not in " + "|".join(STATUS)),
        ("bucket", fields.get("bucket") in BUCKET, "not in " + "|".join(BUCKET)),
        ("channel", fields.get("channel") in CHANNEL, "not in " + "|".join(CHANNEL)),
        ("first_seen", real_day(fields.get("first_seen", "")), "not YYYY-MM-DD"),
        ("last_seen", real_day(fields.get("last_seen", "")), "not YYYY-MM-DD"),
        ("score", fields.get("score") == UNKNOWN or bool(SCORE.match(fields.get("score", ""))), "not 0–10 or —"),
        ("url", bool(HTTP_URL.match(fields.get("url", ""))), "not an http(s) url"),
    )
    errors += ["{0}: {1}".format(key, why) for key, ok, why in checks if key in fields and not ok]
    found = lines.count(MARKER)
    if found != 1:
        errors.append("marker: expected once, found {0}".format(found))
    return errors


def check_path(path: str) -> List[str]:
    try:
        with open(path, encoding="utf-8") as handle:
            return validate(handle.read())
    except (OSError, UnicodeDecodeError) as error:
        return ["unreadable: {0}".format(error)]


def validate_payload(payload: object) -> Tuple[int, Dict[str, object]]:
    paths = payload.get("paths") if isinstance(payload, dict) else None
    if not isinstance(paths, list) or not all(isinstance(p, str) for p in paths):
        return 1, {"validate_error": "stdin must be an object with a paths array of strings"}
    return 0, {"dossiers": [{"path": p, "errors": check_path(p)} for p in paths]}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        code, result = 1, {"validate_error": "invalid JSON: {0}".format(error)}
    else:
        code, result = validate_payload(payload)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
