# Match — graph

Main is the orchestrator. It does not score a job.

State: `./schema-state.md`. Policy: `./contract-match.md` (load; never spawn a criteria agent).
Reader law: `job-list/references/flow-read.md`.

Store source (below) and the store is absent or unreadable → name the path and end. `--posting` does not need the store.

```
bind → profile → candidates → filter₁ → extract → filter₂ → match → score
                                                              │
                                 rank ◄── validate{evidence, classify} ◄──┘
```

Fan-out only on extract, match, and each validate role. Same `state.candidate` + same policy on every worker. Batch ~10 when Runtime=workers; else inline sequential.

## bind

Load `./schema-state.md` and `./contract-match.md`. Init state: `candidate` null, empty lists.

## profile

Derive `state.candidate` per schema-state CandidateProfile. Unreadable required file → stop and name it.

## candidates

Parse tokens. At most one selector: `--new` | `--all` | `--posting`.
`--exclude <status>[,<status>…]` is a modifier; it consumes the next token. Status vocabulary = `job-list/references/flow-read.md` frontmatter `status:`. Unknown status, `--exclude` with `--posting`, unknown `--` flag, leftover tokens, or two selectors → stop.

1. `--posting`, or no selector and the message already holds a posting body (role text or structured facts — not a lone company/title token) → one candidate: that body. Never fetch. No body → stop.
2. `--all`, or `--exclude` with no selector → store, every parseable dossier except `dropped` and dead-by-log, then drop `--exclude` statuses.
3. Empty or `--new` → store, frontmatter `status:` = `new`, not dead-by-log, then drop `--exclude` statuses.

Zero → `No dossiers to match.` and end.
`--posting`: extract next, then filter₁ on the JobProfile (no Posting facts table). Store sources keep the graph order below.

## filter₁

Main. Contract hard filters 1–5 on Posting facts + frontmatter `title` + `state.candidate`. `--posting`: same filters on the JobProfile after extract (`title` / `location` / `work_model` / `work_auth` / `hiring_route` / `salary`). First hit → `state.blocked`. Do not score.

## extract

Load `./worker-extract.md`. Paste per that file, including its JobProfile JSON block. Write `state.jobs[]`. Malformed → `state.gaps`.

## filter₂

Main. Contract HF6 on JobProfile + `state.candidate`. Hit → move to `state.blocked`, drop from `state.jobs`.

## match

Load `./worker-match.md`. Input per worker: the same CandidateProfile JSON + the same contract body + its JobProfile batch + the MatchResult JSON block from that file. No dossier prose.
Write `state.matches[]`. Malformed → `state.gaps`.

## score

Main. Resolve `./scripts/score.py` from the loaded job-match skill root. Resolve
the first working Python 3 launcher: `python3`; on Windows, `py -3`; otherwise
`python` only when its reported major version is 3. Missing launcher or unreadable
scorer → name the dependency and end.

Run the resolved launcher and absolute scorer path with `state.matches` on stdin.
It returns the same array with `match_score`, `decision`, and `confidence` filled
from each `score_breakdown`. A row carrying `score_error` → `state.gaps` and drop
that row; continue with the remaining rows.

## validate

Load `./worker-validate.md`. Rows with `match_score >= 75` or `confidence < 0.7`
after score are selected once; the set does not shrink if a later role lowers
the score.
Roles run in order: evidence, then classify. Never mix roles in one worker. Parallelize dossiers inside a role.
Each role pastes the MatchResult currently in `state.matches` (after the previous role applied). `APPROVED` leaves the row; `CORRECTION_REQUIRED` replaces it, and a replaced row goes back through **score** before rank.
Malformed or failed validate output → `state.gaps` and drop the row.
Non-reviewed rows stay as match wrote them.

## rank

Final message only: the prompt’s scaffold if it gave one, else ranked `- **{title} at {company}**` / url / first strength. Worker JSON and state stay off that message. End.
