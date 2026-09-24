#!/usr/bin/env python3
"""Floor whole years of experience from role date ranges.

The one years rule for the kit (``references/schemas/schema-state.md``
CandidateProfile ``years_experience``). Every skill that states a years figure
runs this script instead of counting months by hand. A caller that needs years
of one title or skill passes only the roles that show it.

A date is ``{Mon[.] YYYY} <sep> {Mon[.] YYYY | Present}``; ``<sep>`` is ``--``,
``-``, ``–``, or ``—`` with optional spaces; the month is its full English name
or its 3-letter abbreviation, any case. Ranges are inclusive, a month two roles
share counts once, and ``Present`` is the current month. The result is
floor(unique months / 12). No parseable range → ``null``, never 0.

stdin: ``{"dates": ["Mar 2021 -- Present", ...], "today": "YYYY-MM"}``;
``today`` is optional and defaults to the current month.
stdout: ``{"years": <int | null>, "unparsed": [<index>, ...]}``, or
``{"years_error": "..."}`` with exit 1.
"""

import json
import re
import sys
from datetime import date
from typing import Dict, List, Optional, Set, Tuple

MONTHS: Tuple[str, ...] = (
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
)
_MONTH_INDEX: Dict[str, int] = {}
for _number, _name in enumerate(MONTHS):
    _MONTH_INDEX[_name] = _number
    _MONTH_INDEX[_name[:3]] = _number

_POINT = r"([A-Za-z]+)\.?\s+(\d{4})"
RANGE = re.compile(
    r"^\s*" + _POINT + r"\s*(?:--|-|–|—)\s*(?:" + _POINT + r"|(present))\s*$",
    re.IGNORECASE,
)
TODAY = re.compile(r"^(\d{4})-(\d{2})$")


def month_number(name: str, year: str) -> Optional[int]:
    """Return months since year 0 for a month name and year, or None."""
    index = _MONTH_INDEX.get(name.lower())
    if index is None:
        return None
    return int(year) * 12 + index


def months_of(text: str, today: int) -> Optional[Set[int]]:
    """Return the inclusive month set a date range covers, or None when unparseable."""
    match = RANGE.match(text)
    if match is None:
        return None
    start = month_number(match.group(1), match.group(2))
    if match.group(5):
        end: Optional[int] = today
    else:
        end = month_number(match.group(3), match.group(4))
    if start is None or end is None or end < start:
        return None
    return set(range(start, end + 1))


def years(dates: List[str], today: int) -> Tuple[Optional[int], List[int]]:
    """Return floor(unique months / 12) and the indexes that did not parse."""
    covered: Set[int] = set()
    unparsed: List[int] = []
    parsed = False
    for index, text in enumerate(dates):
        months = months_of(text, today)
        if months is None:
            unparsed.append(index)
            continue
        parsed = True
        covered |= months
    return (len(covered) // 12 if parsed else None), unparsed


def years_payload(payload: object) -> Tuple[int, Dict[str, object]]:
    if not isinstance(payload, dict):
        return 1, {"years_error": "stdin must be an object with a dates array of strings"}
    dates = payload.get("dates")
    if not isinstance(dates, list) or not all(isinstance(d, str) for d in dates):
        return 1, {"years_error": "stdin must be an object with a dates array of strings"}
    raw_today = payload.get("today")
    if raw_today is None:
        now = date.today()
        today = now.year * 12 + now.month - 1
    else:
        match = TODAY.match(raw_today) if isinstance(raw_today, str) else None
        if match is None or not 1 <= int(match.group(2)) <= 12:
            return 1, {"years_error": "today must be YYYY-MM"}
        today = int(match.group(1)) * 12 + int(match.group(2)) - 1
    result, unparsed = years(dates, today)
    return 0, {"years": result, "unparsed": unparsed}


def main() -> int:
    try:
        payload = json.loads(sys.stdin.buffer.read().decode("utf-8-sig"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        code, result = 1, {"years_error": "invalid JSON: {0}".format(error)}
    else:
        code, result = years_payload(payload)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
