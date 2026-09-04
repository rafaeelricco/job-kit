# Match — graph

Main is the orchestrator. It does not score a job.

State: `./references/schemas/schema-state.md`. Policy: `./references/contracts/contract-match.md` (load; never spawn a criteria agent).
Reader law: `job-store/references/flows/flow-read.md`.

Store source (below) and the store is absent or unreadable → name the path and end. `--posting` does not need the store.

```
bind → profile → candidates → filter₁ → extract → filter₂ → match → score
                                                              │
report ◄─ advise ◄─ select ◄─ order ◄─ validate ◄──────────────┘
```

Fan-out only on extract, match, validate, and advise. Same `state.candidate` + same policy on every worker. Batch ~10 when Runtime=workers; else inline sequential.

## bind

Load `./references/schemas/schema-state.md` and `./references/contracts/contract-match.md`. Init state: `candidate` null, empty lists.

## profile

Derive `state.candidate` per schema-state CandidateProfile. Unreadable required file → stop and name it.

## candidates

Parse tokens. At most one selector: `--new` | `--all` | `--posting` | one
`scout/jobs/` filename. `--exclude <status>[,<status>…]` is a modifier; it
consumes the next token. `--top <n>` consumes one positive integer and is legal
with every selector; absent means no cap. Status vocabulary =
`job-store/references/flows/flow-read.md` frontmatter `status:`. Missing, non-integer,
non-positive, or repeated `--top` values → stop. Unknown status, `--exclude`
with `--posting` or a dossier, an unmatched `.md` filename, unknown flags,
leftover tokens, or two selectors → stop.

1. `--posting`, or no selector and the message already holds a posting body (role text or structured facts — not a lone company/title token) → one candidate: that body. Never fetch. No body → stop.
2. A dossier filename → that exact readable, parseable file under `scout/jobs/`.
   Use its stored snapshot, never fetch, and do not apply status or dead-log filters.
3. `--all`, or `--exclude` with no selector → store, every parseable dossier except `dropped` and dead-by-log, then drop `--exclude` statuses.
4. Empty or `--new` → store, frontmatter `status:` = `new`, not dead-by-log, then drop `--exclude` statuses.

Zero → `No dossiers to match.` and end.
`--posting`: extract next, then filter₁ on the JobProfile (no Posting facts table). Store sources keep the graph order below.

## filter₁

Main. Contract hard filters 1–5 on Posting facts + frontmatter `title` + `state.candidate`. `--posting`: same filters on the JobProfile after extract (`title` / `location` / `work_model` / `work_auth` / `hiring_route` / `salary`). First hit → `state.blocked`. Do not score.

## extract

Load `./references/workers/worker-extract.md`. Paste per that file, including its JobProfile JSON block. Write `state.jobs[]`. Malformed → `state.gaps`.

## filter₂

Main. Contract HF6 on JobProfile + `state.candidate`. Hit → move to `state.blocked`, drop from `state.jobs`.

## match

Load `./references/workers/worker-match.md`. Input per worker: the same CandidateProfile JSON + the same contract body + its JobProfile batch + the MatchResult JSON block from that file. No dossier prose.
Write `state.matches[]`. Malformed → `state.gaps`.

## score

Main. Resolve `./scripts/score.py` from the loaded job-match skill root. Resolve
the first working Python 3 launcher: `python3`; on Windows, `py -3`; otherwise
`python` only when its reported major version is 3. Missing launcher or unreadable
scorer → name the dependency and end.

Run the resolved launcher and absolute scorer path with one JSON object on
stdin: `{"candidate": state.candidate, "jobs": state.jobs, "matches": state.matches}`.
It returns the matches array with `experience` and `role_type` derived,
`match_score`, `decision`, and `confidence` filled from each `score_breakdown`,
and unquoted `strengths` / `gaps` / `blockers` items moved to `evidence_dropped`.
A row carrying `score_error` → `state.gaps` and drop that row; a row carrying
`evidence_dropped` → note those items in `state.gaps` and keep the row.

## validate

Load `./references/workers/worker-validate.md`. Rows with `match_score >= 75` or `confidence < 0.7`
after score are selected once. Parallelize dossiers.
Each worker pastes the MatchResult currently in `state.matches`. `APPROVED` leaves the row; `CORRECTION_REQUIRED` replaces it, and a replaced row goes back through **score** before order.
Malformed or failed validate output → `state.gaps` and drop the row.
Non-reviewed rows stay as match wrote them.

## order

Order valid matches by final `match_score` descending. Preserve candidate order
for equal scores.

## select

Apply `--top <n>` after validation and ordering. With no modifier, retain every
valid match. Only retained rows proceed to advise.

## advise

Run `./scripts/scaffold_guidance.py` (same launcher as **score**) with
`{"candidate": state.candidate, "jobs": <selected JobProfiles>}` on stdin; it
emits one ResumeGuidance skeleton per job with every requirement in place and
exact-token holds already `held`. Load `./references/contracts/contract-resume-guidance.md` and
`./references/workers/worker-resume-guidance.md`. Pass CandidateProfile, selected JobProfiles, the
skeletons, and the Skill hold law—never dossier prose or MatchResult claims.
Validate the batch with `./scripts/validate_guidance.py`. Add valid rows to
`state.guidance`; add invalid rows to `state.gaps` without dropping their match.

## report

Use the prompt scaffold when supplied. Otherwise retain title, company, URL,
and first strength, then add held requirements, requirements not evidenced by
the thin match profile, unresolved requirements, and exact priority roles.
Invalid guidance prints `Resume guidance unavailable`; raw worker/state JSON
stays hidden. End.
