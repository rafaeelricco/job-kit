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
HF7 (`contract-match.md` hard filter 7, language) → Gaps `match blocked`, drop. Do not re-run Gate 1–6.
match → MatchResult, then invoke the resolved scorer with
`{"candidate": <CandidateProfile>, "jobs": <JobProfiles>, "matches": <MatchResults>}`
on stdin. A row carrying `score_error` → Gaps; continue with the remaining rows.
`decision` below `possible_match` (`weak_match` or `skip`) → Gaps
`match below bar`, drop.

Do not write `match_score` / `decision` onto the dossier. Scout `score` stays the 0–10 skill share. Do not print the job-match report.

Output: persist-set rows (url + score + extract fields unchanged). Unreadable
job-match reference or scorer, or no Python 3 launcher → name it and end; write
nothing this run.
