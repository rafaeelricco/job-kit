"""Normalize a posting URL into the store identity.

One row per normalized URL is the whole identity contract
(``references/schemas/schema-dossier.md`` "URL normalize"), so every writer and
reader must agree byte for byte. The rules live here; the prose beside them
restates them and ``tests/test_invariants.py`` pins the two together.

stdin: ``{"urls": [...]}``. stdout: ``{"urls": [...]}`` in the same order, or
``{"normalize_error": "..."}`` with exit 1.
"""

import json
import re
import sys
from typing import Dict, List, Tuple
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKER_PREFIXES: Tuple[str, ...] = ("utm_", "li_")
TRACKER_KEYS: Tuple[str, ...] = (
    "trk", "trackingId", "trkInfo", "originalSubdomain", "eBP",
    "position", "pageNum", "refId", "gclid", "fbclid", "gh_src",
)
_TRACKERS = frozenset(key.lower() for key in TRACKER_KEYS)

# A board whose path carries a mutable slug beside an opaque id. The board
# rewrites the slug (title, company, place); the id it does not.
HIRINGCAFE = re.compile(r"^/job/(?:[^/]*-)?([a-z0-9]{16})$")
# An ATS whose apply step is a path suffix on the posting itself.
APPLY_SUFFIX = {"jobs.ashbyhq.com": "/application", "jobs.lever.co": "/apply"}
ATS_POSTING = re.compile(r"^/[^/]+/[^/]+$")


def is_tracker(key: str) -> bool:
    lowered = key.lower()
    return lowered in _TRACKERS or lowered.startswith(TRACKER_PREFIXES)


def collapse_path(host: str, path: str) -> str:
    if host == "hiringcafe.com":
        match = HIRINGCAFE.match(path)
        if match:
            return "/job/" + match.group(1)
    suffix = APPLY_SUFFIX.get(host)
    if suffix and path.endswith(suffix) and ATS_POSTING.match(path[: -len(suffix)]):
        return path[: -len(suffix)]
    return path


def normalize(raw: str) -> str:
    parts = urlsplit(raw.strip())
    scheme = parts.scheme.lower()
    host = (parts.hostname or "").lower()
    if scheme not in ("http", "https") or not host:
        raise ValueError("not an http(s) url: {0!r}".format(raw))
    authority_host = "[{0}]".format(host) if ":" in host else host
    netloc = authority_host if parts.port is None else "{0}:{1}".format(authority_host, parts.port)
    path = collapse_path(host, parts.path.rstrip("/") or "/")
    pairs = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if not is_tracker(key)
    ]
    pairs.sort(key=lambda pair: pair[0])
    return urlunsplit((scheme, netloc, path, urlencode(pairs), ""))


def normalize_payload(payload: object) -> Tuple[int, Dict[str, object]]:
    urls = payload.get("urls") if isinstance(payload, dict) else None
    if not isinstance(urls, list) or not all(isinstance(u, str) for u in urls):
        return 1, {"normalize_error": "stdin must be an object with a urls array of strings"}
    out: List[str] = []
    for index, raw in enumerate(urls):
        try:
            out.append(normalize(raw))
        except ValueError as error:
            return 1, {"normalize_error": "urls[{0}]: {1}".format(index, error)}
    return 0, {"urls": out}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        code, result = 1, {"normalize_error": "invalid JSON: {0}".format(error)}
    else:
        code, result = normalize_payload(payload)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
