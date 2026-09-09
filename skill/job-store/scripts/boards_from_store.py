"""Emit board-registry rows from stored dossier identities.

stdin: ``{"dossiers": [{"url": ..., "company": ...}]}``.
stdout: ``{"boards": [{"ats", "slug", "company", "url"}]}`` sorted by
(ats, slug), one row per (ats, slug); or ``{"boards_error": "..."}`` with
exit 1. Reads nothing from disk and fetches nothing: the caller pastes
frontmatter values, which are posting-controlled data.
"""

import json
import sys
from typing import Dict, Optional, Tuple
from urllib.parse import urlsplit

from normalize_url import normalize

# schema-dossier.md "ATS family": apex host, family, board-URL prefix.
FAMILIES: Tuple[Tuple[str, str, str], ...] = (
    ("greenhouse.io", "greenhouse", "https://job-boards.greenhouse.io/"),
    ("lever.co", "lever", "https://jobs.lever.co/"),
    ("ashbyhq.com", "ashby", "https://jobs.ashbyhq.com/"),
)


def family_of(host: str) -> Optional[Tuple[str, str]]:
    for apex, family, prefix in FAMILIES:
        if host == apex or host.endswith("." + apex):
            return family, prefix
    return None


def board_of(url: str, company: str) -> Optional[Dict[str, str]]:
    parts = urlsplit(normalize(url))
    found = family_of(parts.hostname or "")
    segments = [segment for segment in parts.path.split("/") if segment]
    if found is None or not segments:
        return None
    family, prefix = found
    return {
        "ats": family,
        "slug": segments[0],
        "company": company,
        "url": prefix + segments[0],
    }


def boards_payload(payload: object) -> Tuple[int, Dict[str, object]]:
    rows = payload.get("dossiers") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or not all(isinstance(r, dict) for r in rows):
        return 1, {"boards_error": "stdin must be an object with a dossiers array of objects"}
    seen: Dict[Tuple[str, str], Dict[str, str]] = {}
    for index, row in enumerate(rows):
        url, company = row.get("url"), row.get("company")
        if not isinstance(url, str) or not isinstance(company, str):
            return 1, {"boards_error": "dossiers[{0}]: url and company must be strings".format(index)}
        try:
            board = board_of(url, company)
        except ValueError as error:
            return 1, {"boards_error": "dossiers[{0}]: {1}".format(index, error)}
        if board is not None:
            seen.setdefault((board["ats"], board["slug"]), board)
    return 0, {"boards": [seen[key] for key in sorted(seen)]}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        code, result = 1, {"boards_error": "invalid JSON: {0}".format(error)}
    else:
        code, result = boards_payload(payload)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
