"""Fold a Provenance `source` token onto its canonical pack id.

Identity is the pack `id` that found the row
(``references/schemas/schema-dossier.md`` "Provenance"). A host-shaped value is
legal for an ad-hoc pack (``job-scout/references/flows/flow-preflight.md``), so
this script never rejects: it folds a known alias and reports anything it does
not recognise, leaving the caller to decide.

stdin: ``{"sources": [...], "ids": [...]}``  (``ids`` = the run's deck ids)
stdout: ``{"sources": [...], "unknown": [...]}`` in the same order, or
``{"normalize_error": "..."}`` with exit 1.
"""

import json
import sys
from typing import Dict, FrozenSet, List, Tuple

# Policy, not derivation: a host cannot be mapped to a pack id by rule, because
# an ad-hoc pack's id IS its host. Every entry below is a spelling observed in
# the corpus and folded by operator decision.
ALIASES: Dict[str, str] = {
    "linkedin.com": "linkedin-jobs",
    "linkedin": "linkedin-jobs",
    "hiring.cafe": "hiring-cafe",
    "hiringcafe": "hiring-cafe",
    "hiringcafe.com": "hiring-cafe",
    "workatastartup": "work-at-a-startup",
    "workatastartup.com": "work-at-a-startup",
    "jobs.ashbyhq.com": "ashby",
    "job-boards.greenhouse.io": "greenhouse",
}

# The reader's legacy branch keeps the label word when a line has no ` · date `
# tail; a stored value may therefore arrive prefixed.
PREFIX = "source "


def canonical(raw: str, known: FrozenSet[str] = frozenset()) -> str:
    """Fold a spelling onto its pack id, unless the run already declares it.

    ``known`` is the run's id vocabulary. A token in it is an identity the run
    itself declared — an ad-hoc pack's id IS its host — so it outranks the alias
    table; folding it would attribute the row to a pack that never ran.
    """
    token = raw.strip()
    if token.startswith(PREFIX):
        token = token[len(PREFIX):].strip()
    if token in known:
        return token
    return ALIASES.get(token, token)


def normalize_payload(payload: object) -> Tuple[int, Dict[str, object]]:
    sources = payload.get("sources") if isinstance(payload, dict) else None
    if not isinstance(sources, list) or not all(isinstance(s, str) for s in sources):
        return 1, {"normalize_error": "stdin must be an object with a sources array of strings"}
    raw_ids = payload.get("ids") if isinstance(payload, dict) else None
    if raw_ids is None:
        raw_ids = []
    if not isinstance(raw_ids, list) or not all(isinstance(i, str) for i in raw_ids):
        return 1, {"normalize_error": "ids array must be strings when present"}
    # The run's own vocabulary outranks the alias table, so it is built before
    # the fold: an id the run declared is an identity, not a spelling to fold.
    known = frozenset(raw_ids)
    out: List[str] = [canonical(raw, known) for raw in sources]
    # Without a vocabulary nothing can be judged unknown, so an empty deck of
    # ids reports nothing rather than reporting everything.
    unknown: List[str] = sorted(set(out) - known) if known else []
    return 0, {"sources": out, "unknown": unknown}


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
