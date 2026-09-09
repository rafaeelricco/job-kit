# Scout — persist set

Input: `status=live` rows that passed `SKILL.md` §4 Gate, with Rank `score`.

Drop to Gaps, no dossier:

- `score` is `—` or integer ≤ 7 → `score<=7`
- then match (below) fails

Keep: integer `score` 8–10 and match decision at/above `possible_match` (`match_score` ≥ 70).

Match: resolve the installed `job-match` skill root, then derive CandidateProfile
once per its `references/schemas/schema-state.md`. Load `references/workers/worker-extract.md`,
`references/contracts/contract-match.md`, and `references/workers/worker-match.md`. Require a readable
`scripts/score.py`, and resolve the Python 3 launcher using job-match's order:
`python3`, Windows `py -3`, then a `python` command verified as major version 3.
Fan-out batch ~10. Per row, paste that row's Verified extract as the posting body
— never fetch, never open Profile root.

extract → JobProfile. Malformed → Gaps, drop.
HF8 (`contract-match.md` hard filter 8, language) → Gaps `match blocked`, drop. Do not re-run Gate 1–7.
match → MatchResult, then invoke the resolved scorer with
`{"candidate": <CandidateProfile>, "jobs": <JobProfiles>, "matches": <MatchResults>}`
on stdin. A row carrying `score_error` → Gaps; continue with the remaining rows.
`decision` below `possible_match` (`weak_match` or `skip`) → Gaps
`match below bar`, drop.

Carry the scorer's `match_score` and `decision` on each kept row as Posting-facts `match_score` and `match_decision` (`job-store/references/schemas/schema-dossier.md`). Scout `score` stays the 0–10 skill share. Do not print the job-match report.

Output: persist-set rows (url + score + `match_score` + `match_decision` + extract fields unchanged). Unreadable
job-match reference or scorer, or no Python 3 launcher → name it and end; write
nothing this run.
