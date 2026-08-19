# Job scout — pipeline

Paths are relative to the Profile root from the `job-profile-root` skill.
Resolve every `data/*` path against that root, not session CWD.
Skill-local files live under `./references/` next to `SKILL.md`.
You sequence phases. Workers search/extract only. You merge, gate, rank, report.
Do not invent jobs or company facts.

Never paste any part of this file into a worker brief. The two paste cards carry every
rule a worker needs.

## Mode: list only

Finds and reports jobs. Never applies, messages, or connects. A login / signup gate
that blocks listing or extract → pass it; listing and extract are the only things a
gate-pass buys. Done when the Report ships and Phase 6 has written every dossier it
must → **STOP**.

## Inputs (read-only)

| Path                                                            | Supplies                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `data/candidate.yaml`                                           | salary, work auth, employment_routes, relocation                                       |
| `data/job_search.yaml`                                          | positions, keywords, filters                                                           |
| `data/search_packs.yaml`, else `./references/search_packs.yaml` | enabled packs, YAML order; chosen set is Phase 0 pick; whichever file wins, wins whole |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml`         | card                                                                                   |
| legacy `data/skills-by-company.yml`, when present               | company↔stack history an update never migrated                                         |

Glob `data/*.{yaml,yml}`. Conflict: candidate wins people prefs; job_search wins filters — note it.

## Phase 0 — preflight + context (main)

1. Resolve Profile root via the `job-profile-root` skill; print
   `Profile root: /abs/path`. Probe the deck: `data/search_packs.yaml` under
   Profile root, else `./references/search_packs.yaml` next to this skill.
   Print `Deck: <abs path>`.
   Neither readable, or the winner fails to parse → STOP, name the file.
   Print `Browser: <driver>` — the tool that will open pages this run. Native in
   an agentic browser (Aside); the `browser-use` skill in a coding agent. No
   driver that can open a page, click a control, and hold a logged-in session →
   **STOP** before the pack pick and name what is missing. A text fetcher is not
   a driver: this run cycles location filters, passes login gates, and reads
   pages that render client-side.
   Never merge the two files and never read the fallback when the profile deck exists.
   `job_search.yaml` carrying a key scout does not consume → **STOP**: an update
   never rewrites profile data, so a constraint the operator configured would
   silently stop applying. Consumed keys are exactly `work_model`,
   `seniority_level`, `job_types`, `date_posted`, `positions`, `keywords`,
   `locations`. Any other key holding a value that is not empty, `false`, or null
   → name the file and the key, and say to migrate via `/job-profile-me`.
   Never derive a replacement value — these are operator-owned, per
   `job-profile-init/references/flow-fill.md`. Keep this an allowlist rather than a list of
   dropped keys: a key scout stops consuming then fails closed here instead of
   going quietly unread.
2. Pack pick (blocking). List every pack in the resolved deck whose `enabled` is
   true or absent, file order, as `N. {id}`. Last line: `{N+1}. Search in all`.
   Listed packs = 0 → STOP, no enabled pack. That list is chat text — not a
   question. **STOP** and wait. Do not search, and do not write the deck.
   Valid reply: one or more listed numbers (those packs, file order), or
   `Search in all` (case-insensitive) / the last number (every listed pack).
   Empty, unlisted number, or other text → print the list again and wait.
   Each `enabled: false` pack stays unlisted, recorded internally
   (`skipped: disabled`), omitted from chat.
   Chosen set = those packs. Phase 1 runs only that set.
   usable=0 → Gaps `skipped: {pack} (dry)`.
3. Read inputs → print `### Profile card` and `### Constraints`.
   - Profile card: primary role · seniority · top skills · industries · languages · target stack
   - Constraints: work model · seniority level · job types · positions · keywords · locations ·
     date_posted · salary_range_usd · work auth · employment_routes · relocation
   - Markets intent (prose in Constraints): listed locations are strong-pay markets
     (employers that pay USD, EUR, or GBP). Remote roles paid in those currencies are
     in scope regardless of company country. `Anywhere` in `locations` is a wildcard,
     not a market: it keeps every location. Hire-from routes come from the JD's printed
     `hiring_route`, never the job's own location.

Print both blocks before any search. Pass both **verbatim** into every search brief —
they are the workers' only source for filters and for `[industry]`.

Phase 0 opens no page and signs in to nothing — the run's first network access is
Phase 1. A surface that answers signed-out is a Phase 1 defect
(`contract-search.md` step 1), never a preflight.

## Phase 1 — SEARCH (chosen packs)

For **each** chosen pack: run `./references/worker-search-<surface>.md` with
PROFILE_CARD + CONSTRAINTS + PACK + CONTRACT_SEARCH (`./references/contract-search.md`) **verbatim**.
Do not run a pack, and record `defect: unsupported_pack {id}` naming it under Gaps,
when either: `surface` names no `worker-search-*.md` in this skill; `entry` is not one
`http(s)` URL. A profile deck is never rewritten by an update, and
`/job-profile-me` checks `surface` but not `entry` shape, so a deck can still
carry a legacy source-row list, or a `from data/sources.yaml <group>` entry it no
longer resolves. Both run silently — an unresolvable entry reports as a dry pack,
which is the same string a healthy-but-empty pack emits. Name the migration in Gaps:
give each source row its own pack with that row's URL as `entry`, or drop the pack.

Do not summarize, do not substitute a field list.
A worker that was not given a constraint or guardrail cannot apply it.

Parallelism: at most 5 packs at once. Never two packs with the same `entry` host
concurrent — two workers passing one gate race the session and can trip duplicate OTPs
or account throttling. Every `entry` is one URL, so the host is always evaluable.
LinkedIn stays the named case — `entry` host `linkedin.com` or ending `.linkedin.com`
covers both `linkedin-jobs` and `linkedin-posts`, one host under two playbooks.
Launch up to 5 → join → Phase 2 MERGE.
Every chosen pack attempted (`auth_gate` is pack defect).
Expect `### Candidates` + `### Defect log` per unit — headings defined in
`contract-search.md`.

## Phase 2 — MERGE (main only)

Pre-merge pack checker: `formulations_run` missing or <3 and no formulations defect and
verdict not `auth_gate` → `formulations_short`; candidates not merge-eligible until
re-run; main enforces. `auth_gate` packs: empty candidates merge-eligible; do not re-run
— gate-pass was already attempted in the search unit and failed. Carry the actual
`formulations_run`.
Every chosen pack id must have Defect log row before extract.

Merge per `./references/contract-search.md` "URL normalize". One row per normalized URL.
Prefer non-`—` author; best channel per `## Channel sort`.

## Phase 3 — EXTRACT

Batch size = 5 job URLs. For each unique job URL batch run `worker-extract`;
independent batches may parallel up to 5; each batch opens URLs one at a time.
Batches that would gate-pass the same host are not independent — serialize them, same
rule as Phase 1. Expect `### Verified` rows — heading defined in `contract-extract.md`.

## Phase 4 — CONTRACT GATE (main)

Every row has every search key from `./references/contract-search.md` plus every extract key from
`./references/contract-extract.md`, whatever its status. Missing key → halt; name it under Gaps.
Never invent a field to pass the gate. Unknown = `—`.

### Location gate (post-extract, main)

Re-apply contract-search Location keep on extract-confirmed locations; deferred — becomes
keep/drop here; do not redefine keep rules in this file.

Search-time keeps still apply; this gate closes the deferred path.

## Phase 5 — RANK + REPORT (main)

Drop dead from scored tables. Uncertain = unscored; lands under Gaps only;
never displace a scored row; never enter Do this first / the ranked table.
Location-gate drops already excluded above — do not score them.

REAL FIT = stack. Geo/auth is a score factor only for onsite/hybrid
(see `## Score`).

Score ≥7 via `## Score` — the header census counts every live≥7 row; Do this first
lists only the bucketed ones. Ranked table keep is ≥8, also bucketed only.
Bucket per `## Bucket`. A row whose factors do not sum to its printed score is
a defect: fix the row, do not adjust the sum. Print factors only on dossier
`## Verdict` — never a chat Score audit.

Emit final markdown **exactly** per `./references/format-report.md`. Named headings only. Then Phase 6.

## Phase 6 — PERSIST (main only) → STOP

**Writable SSOT for this skill.** Main writes; a worker never does. Only these
path shapes under Profile root: `scout/jobs/*.md`, exclusive lock directories
`scout/jobs/*.lock` (create via `mkdir`, remove when the write finishes — see
`schema-dossier.md` concurrent writers), lock metadata `scout/jobs/*.lock/owner`, and
lock-internal place staging `scout/jobs/*.lock/place-*`.
Every other Profile-root path (`data/`, `cv/`, …) is read-only. Never create,
write, list-require, or delete `scout/runs/` — an orphan from an older
revision is ignored.

1. Resolve `scout/jobs/` and every file you are about to write to its physical
   path first (prospective `scout/jobs` via its deepest existing ancestor), and
   **STOP** unless that path is still under the canonical Profile root. Only
   then `mkdir -p scout/jobs` when absent. A store or dossier that is a symlink
   out of the tree passes every listability and parse check while the write lands
   somewhere else — the writable path shapes above are a containment rule, not a
   spelling. Never `mkdir` through an out-of-tree symlink.
2. Write nothing until `scout/jobs/` can be **listed**, and every existing dossier
   can be **read and parsed**. A store that is writable but not listable (or a
   dossier that will not parse) cannot answer which file a `url` already owns,
   which suffix that name carries, or what `status:` and `## Application log` it
   already holds — writing there overwrites the operator's application history
   with a fresh `status: new` under a second filename. Unreadable or unparseable
   → print the path under Gaps and STOP, same as a failed write.
3. One dossier per row with `status=live` that passed the Phase 4 gate — including
   `score<7` rows. A `dead` row that already has a
   dossier goes through the `schema-dossier.md` re-run handler so its closure log is
   appended; `uncertain` rows stay in chat Gaps only and create no dossier;
   `dead` rows never seen live create no dossier and are not listed in chat.
4. Shape, filename, and the re-run rules are owned by `./references/schema-dossier.md`.
5. Unwritable path (permission, read-only FS) → print the error and the path under
   Gaps and STOP. Never fall back to another directory. A failed write is never silent.
   A dossier that fails stops the phase; report the error in chat under Gaps.

Then **STOP**.

## Score (0–9; keep ≥ 7)

| Factor                                                       | Points | When                                                                                                                |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Skills / stack overlap                                       | 0–7    | always; **0–5** when geo/auth is in the sum                                                                         |
| Seniority match                                              | 0–2    | always                                                                                                              |
| Geo/auth route fit (prefer printed work_auth + hiring_route) | 0–2    | only when extract `work_model` is onsite or hybrid **and** the matching `job_search.yaml` `work_model` flag is true |

Do not score recency. `date_posted` already dropped out-of-window rows at search.

Geo/auth is absent from the sum when `work_model` is remote (or the profile flag for
the posting's model is false). Dossier Verdict prints `—` in that cell; `—` is not a
number and is not added. Jurisdiction / timezone walls still bucket `EU/US-only`;
they do not take points off a remote row.

When geo/auth is in the sum, skills max is 5 so the row still caps at 9.

Worked remote row (Ojin Product Engineer): TS/React/Node/Python/agents, listed
position, 3–5y, remote CET → `7 + 2 + geo — = 9`.

## Bucket (main-derived; never a gated column)

Derived here from extract output. NEVER set by a worker. First match wins.

| Printed on the JD                                                                                     | Bucket                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `hiring_route` names EOR / Deel / Oyster / "hire from anywhere"                                       | `EOR`                                       |
| `hiring_route` names contractor / B2B, **or** `location` prints LATAM / global / anywhere / worldwide | `direct`                                    |
| `work_auth` names a jurisdiction requirement, **or** `location` restricts to a country or region      | `EU/US-only` (blocker = the printed string) |
| none of the above                                                                                     | `unbucketed`                                |

`unbucketed` enters no ranked table and no Do this first — it still gets a dossier and
still counts in the header census. List under Gaps. Never guess a route from a company's
country. `EOR` is reachable only when `candidate.yaml`
`employment_routes.employer_of_record` is Yes.

Note: `direct` and `EOR` name the hire-from _route_ the JD prints, not the job's location.

## Channel sort (report tables)

`direct_email` → `dm_request` → `founder` → `ats`, then score desc.
