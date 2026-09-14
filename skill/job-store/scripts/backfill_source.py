"""One-shot repair: fold every drifted Provenance `source` in a dossier store.

The `source` token is the pack `id` that found the row
(``references/schemas/schema-dossier.md`` "Provenance"). Spellings that drifted
before that law was enforceable are folded here through
``normalize_source.canonical``, which is the single alias table.

Two defects are repaired on the one line, both above the ownership marker and
therefore inside the scout-owned region the schema rewrites each run
(``schema-dossier.md`` "Re-run rules"):

1. a non-canonical `source` token, and
2. a missing ` · date ` tail, which sends the whole line down the reader's
   legacy branch and strips nothing of the label word.

Nothing else in the file is touched: not the filename, not `first_seen`, not
`status:`, and not one byte below ``<!-- scout never writes below this line -->``.

Writes are staged and atomically renamed under a per-URL lock, per
``references/contracts/contract-persistence.md``. A dossier whose lock cannot be
taken is skipped and named in the report, never forced.

usage:  python3 backfill_source.py --store <path/to/scout/jobs> [--apply]

Without ``--apply`` it is a dry run: it prints the plan and writes nothing.
"""

import argparse
import hashlib
import os
import re
import shutil
import sys
import tempfile
import time
import uuid
from typing import Dict, List, Optional, Tuple

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from normalize_source import canonical  # noqa: E402  (sibling import, as the kit ships it)
from normalize_url import normalize  # noqa: E402  (the lock contract's identity)

MARKER = "<!-- scout never writes below this line -->"
PROVENANCE = "## Provenance"
# The render template's own separator. A value may itself contain " · ", so the
# line is split on the labels, never on the separator alone.
SOURCE_LINE = re.compile(r"^source (?P<rest>.*)$")
URL_FIELD = re.compile(r'^url:\s*"?(?P<url>[^"]+)"?\s*$', re.MULTILINE)
LOCK_RETRIES = 5
LOCK_SLEEP = 2.0
# `contract-persistence.md` step 3: a lock older than this is stale and is
# reclaimed exactly once, so a crashed writer cannot strand a dossier forever.
LOCK_STALE_SECONDS = 900.0


def digest(url: str) -> str:
    """First 32 lowercase hex characters of the UTF-8 URL, per the lock contract.

    The caller passes the *normalized* URL: identity is the normalized URL
    (``contract-persistence.md`` step 2), so hashing the raw frontmatter value
    would name a different lock than every other writer takes for the same row.
    """
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:32]


def split_source(rest: str) -> Tuple[str, str]:
    """Return (token, tail) where tail is everything from the first label on.

    The token is the first ` · `-delimited segment; a stored value that already
    carries the label word is handled by `canonical`, not here.
    """
    cut = rest.find(" · ")
    if cut == -1:
        return rest.strip(), ""
    return rest[:cut].strip(), rest[cut:]


def repair_line(line: str) -> Optional[str]:
    """Fold the source token and restore a missing date tail. None = no change."""
    match = SOURCE_LINE.match(line)
    if match is None:
        return None
    token, tail = split_source(match.group("rest"))
    # A host-shaped token is a legal ad-hoc pack id. This repair has no run
    # vocabulary, so treat that token as `known` and still fold a bare alias.
    known = frozenset([token]) if "." in token else frozenset()
    folded = canonical(token, known)
    # The labeled reader regex requires a ` · date ` tail; without one the line
    # falls to the legacy branch and keeps its label word. `—` is the schema's
    # own unknown, so restoring it loses nothing the page ever printed.
    if " · date " not in tail:
        tail = tail + " · date —"
    rebuilt = "source {0}{1}".format(folded, tail)
    return None if rebuilt == line else rebuilt


def scout_owned_region(text: str) -> int:
    """Index of the ownership marker, or len(text) when the file has none."""
    at = text.find(MARKER)
    return len(text) if at == -1 else at


def repair_text(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Return (new_text, before, after) for the one Provenance line, or Nones."""
    limit = scout_owned_region(text)
    head, tail = text[:limit], text[limit:]
    if PROVENANCE not in head:
        return None, None, None
    lines = head.split("\n")
    for index, line in enumerate(lines):
        rebuilt = repair_line(line)
        if rebuilt is None:
            continue
        lines[index] = rebuilt
        return "\n".join(lines) + tail, line, rebuilt
    return None, None, None


def stale(lock: str) -> bool:
    """True when the lock directory is older than the contract's staleness window."""
    try:
        return (time.time() - os.stat(lock).st_mtime) > LOCK_STALE_SECONDS
    except FileNotFoundError:
        # Released between the failed mkdir and this stat: not stale, just gone.
        return False
    except OSError:
        return False


def owner_file(lock: str) -> str:
    return os.path.join(lock, "owner")


def write_owner(lock: str, token: str) -> None:
    with open(owner_file(lock), "w", encoding="utf-8") as stream:
        stream.write(token)


def read_owner(lock: str) -> Optional[str]:
    try:
        with open(owner_file(lock), encoding="utf-8") as stream:
            return stream.read()
    except (FileNotFoundError, OSError):
        return None


def release(lock: str, token: str) -> None:
    """Drop the lock only while `owner` still matches, per contract step 7."""
    if read_owner(lock) != token:
        return
    try:
        os.unlink(owner_file(lock))
        os.rmdir(lock)
    except OSError:
        pass


def acquire(lock: str) -> Optional[str]:
    """Exclusive mkdir + owner token. None when the lock cannot be taken.

    A stale lock is reclaimed once. Reclaim re-checks staleness immediately
    before `rmtree` so a lock another writer just acquired is not deleted.
    """
    token = "{0}-{1}".format(os.getpid(), uuid.uuid4().hex)
    reclaimed = False
    for _ in range(LOCK_RETRIES):
        try:
            os.mkdir(lock)
            write_owner(lock, token)
            return token
        except FileExistsError:
            if not reclaimed and stale(lock):
                reclaimed = True
                try:
                    if not stale(lock):
                        time.sleep(LOCK_SLEEP)
                        continue
                    shutil.rmtree(lock)
                except FileNotFoundError:
                    pass
                except OSError:
                    return None
                continue
            time.sleep(LOCK_SLEEP)
        except OSError:
            return None
    return None


def commit(path: str, text: str) -> None:
    """Render to a staged file, then atomically rename over the dossier."""
    folder = os.path.dirname(path)
    handle, staged = tempfile.mkstemp(dir=folder, suffix=".place")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            stream.write(text)
        os.replace(staged, path)
    except BaseException:
        if os.path.exists(staged):
            os.unlink(staged)
        raise


def run(store: str, apply: bool) -> Dict[str, List[str]]:
    report: Dict[str, List[str]] = {"changed": [], "skipped": [], "locked": []}
    for name in sorted(os.listdir(store)):
        if not name.endswith(".md"):
            continue
        path = os.path.join(store, name)
        with open(path, encoding="utf-8") as stream:
            text = stream.read()
        new_text, before, after = repair_text(text)
        if new_text is None:
            continue
        found = URL_FIELD.search(text)
        if found is None:
            report["skipped"].append("{0}: no url: field".format(name))
            continue
        try:
            # Identity is the normalized URL, so this names the same lock every
            # other writer takes for the row — a stored value that predates a
            # normalize rule would otherwise hash to a lock nobody else holds.
            identity = normalize(found.group("url"))
        except ValueError as error:
            report["skipped"].append("{0}: {1}".format(name, error))
            continue
        lock = os.path.join(store, "url-{0}.lock".format(digest(identity)))
        if not apply:
            report["changed"].append("{0}\n    - {1}\n    + {2}".format(name, before, after))
            continue
        token = acquire(lock)
        if token is None:
            report["locked"].append(name)
            continue
        try:
            if read_owner(lock) != token:
                report["locked"].append(name)
                continue
            # Re-read under the lock: a concurrent writer may have landed first.
            with open(path, encoding="utf-8") as stream:
                fresh = stream.read()
            again, before, after = repair_text(fresh)
            if again is None:
                report["skipped"].append("{0}: repaired by another writer".format(name))
            else:
                if read_owner(lock) != token:
                    report["locked"].append(name)
                else:
                    commit(path, again)
                    report["changed"].append("{0}\n    - {1}\n    + {2}".format(name, before, after))
        finally:
            release(lock, token)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--store", required=True, help="path to scout/jobs")
    parser.add_argument("--apply", action="store_true", help="write; omit for a dry run")
    args = parser.parse_args()
    if not os.path.isdir(args.store):
        sys.stderr.write("not a directory: {0}\n".format(args.store))
        return 1
    report = run(args.store, args.apply)
    print("{0} {1} dossier(s)".format("repaired" if args.apply else "would repair", len(report["changed"])))
    for entry in report["changed"]:
        print("  " + entry)
    for entry in report["skipped"]:
        print("  skipped {0}".format(entry))
    for entry in report["locked"]:
        print("  locked, not written: {0}".format(entry))
    return 1 if report["locked"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
