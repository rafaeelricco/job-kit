#!/usr/bin/env python3
"""Fill match_score, decision, confidence on MatchResult rows from score_breakdown.

stdin: a JSON array of MatchResult objects (see references/schema-state.md).
stdout: the same array, scored. Rows the script cannot score are returned with
"score_error" set and the three fields left at their zero values.

Contract: references/contract-match.md. This file owns the arithmetic; the
prose owns the weights and the per-factor point rules.
"""
import json
import sys

WEIGHTS = {
    "primary_stack": 25,
    "experience": 20,
    "seniority": 15,
    "role_type": 15,
    "location": 10,
    "domain": 5,
    "language": 5,
    "preferences": 5,
}

BANDS = [(90, "excellent_match"), (80, "strong_match"), (70, "possible_match"), (50, "weak_match")]


def half_up(x):
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)


def require_integer(name, value):
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name}: must be an integer, got {value!r}")
    return value


def cell_points(name, cell):
    """Return integer points for one factor, or None when unscored."""
    if cell is None:
        return None
    if name == "primary_stack" and isinstance(cell, dict):
        held = require_integer("primary_stack.held", cell.get("held"))
        required = require_integer("primary_stack.required", cell.get("required"))
        if required < 1:
            raise ValueError("primary_stack.required must be at least 1")
        if not 0 <= held <= required:
            raise ValueError("primary_stack.held must be between 0 and required")
        return half_up(WEIGHTS[name] * held / required)
    pts = require_integer(f"{name}: cell", cell)
    if not 0 <= pts <= WEIGHTS[name]:
        raise ValueError(f"{name}: {pts} outside 0..{WEIGHTS[name]}")
    return pts


def score(row):
    breakdown = row.get("score_breakdown")
    if not isinstance(breakdown, dict):
        raise ValueError("score_breakdown must be an object")
    scored = {}
    for name in WEIGHTS:
        pts = cell_points(name, breakdown.get(name))
        breakdown[name] = pts
        if pts is not None:
            scored[name] = pts
    if not scored:
        raise ValueError("no scored factor")
    weight_sum = sum(WEIGHTS[n] for n in scored)
    row["score_breakdown"] = breakdown
    row["match_score"] = half_up(100 * sum(scored.values()) / weight_sum)
    row["confidence"] = round(weight_sum / 100, 2)
    row["decision"] = next((d for floor, d in BANDS if row["match_score"] >= floor), "skip")
    return row


def main():
    rows = json.load(sys.stdin)
    out = []
    for row in rows:
        try:
            out.append(score(row))
        except ValueError as e:
            row["score_error"] = str(e)
            out.append(row)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
