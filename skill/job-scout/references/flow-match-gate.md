# Scout — persist set

Input: `status=live` rows that passed `SKILL.md` §4 Gate, with Rank `score`.

Drop to Gaps, no dossier:

- `score` is `—` or integer ≤ 7 → `score<=7`
- then match (below) fails

Keep: integer `score` 8–10 and match decision at/above `possible_match` (`match_score` ≥ 70).

Match: derive CandidateProfile once per `job-match/references/schema-state.md`. Load `job-match/references/worker-extract.md`, `contract-match.md`, `worker-match.md`. Fan-out batch ~10 (same as job-match). Per row, paste that row's Verified extract as the posting body — never fetch, never open Profile root.

extract → JobProfile. Malformed → Gaps, drop.
HF6 (`contract-match.md` hard filter 6, language) → Gaps `match blocked`, drop. Do not re-run Gate 1–5.
match → MatchResult. Malformed or no `match_score` → Gaps. `decision` below `possible_match` (`weak_match` or `skip`) → Gaps `match below bar`, drop.

Do not write `match_score` / `decision` onto the dossier. Scout `score` stays the 0–10 skill share. Do not print the job-match report.

Output: persist-set rows (url + score + extract fields unchanged). Unreadable job-match reference → name it and end; write nothing this run.
