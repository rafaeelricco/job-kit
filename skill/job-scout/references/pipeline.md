# Job scout — pipeline

Paths are relative to the Profile root from `SKILL.md` (ordered resolver in SKILL.md).
Resolve every `data/*` path against that root, not session CWD.
Skill-local files live under `./references/` next to `SKILL.md`.
You sequence phases. Workers search/extract only. You merge, gate, rank, report.
Do not invent jobs or company facts.

Never paste any part of this file into a worker brief. The two paste cards carry every
rule a worker needs.

## Mode: list only

Finds and reports jobs. Never acts on them. Done when the Report ships and Phase 6
has written the dossier → **STOP**.

## Inputs (read-only)

| Path                                                            | Supplies                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `data/candidate.yaml`                                           | salary, work auth, employment_routes, relocation                |
| `data/job_search.yaml`                                          | positions, keywords, filters, apply_once_at_company             |
| `data/sources.yaml`                                             | tiers, access, channels                                         |
| `data/search_packs.yaml`, else `./references/search_packs.yaml` | every enabled pack, YAML order; whichever file wins, wins whole |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml`         | card                                                            |
| legacy `data/skills-by-company.yml`, when present               | company↔stack history an update never migrated                  |

Glob `data/*.{yaml,yml}`. Conflict: candidate wins people prefs; job_search wins filters — note it.

## Phase 0 — preflight + context (main)

1. Resolve Profile root per `SKILL.md` (ordered probe); print
   `Profile root: /abs/path`. Probe the deck: `data/search_packs.yaml` under
   Profile root, else `./references/search_packs.yaml` next to this skill.
   Print `Deck: <abs path>`.
   Neither readable, or the winner fails to parse → STOP, name the file.
   Never merge the two files and never read the fallback when the profile deck exists.
   `job_search.yaml` still carrying a key this revision dropped → **STOP**: an
   update never rewrites profile data, so the constraint the operator configured
   would silently stop applying. Name the file and the key, and say to migrate
   via `/job-profile-config`. Never derive a replacement value — these are
   operator-owned, per `job-profile-init/fill.md`. The dropped keys:
   - the pre-`seniority_level` boolean `experience_level` map, when no
     `seniority_level` string is present
   - a non-empty `company_blacklist`, `title_blacklist`, or `location_blacklist`,
     whose exclusions no longer reach CONSTRAINTS or any filter
2. Read inputs → print `### Profile card` and `### Constraints`.
   - Profile card: primary role · seniority · top skills · industries · languages · target stack
   - Constraints: work model · seniority level · job types · positions · keywords · locations ·
     date_posted · salary_range_usd · work auth · employment_routes · relocation
   - Markets intent (prose in Constraints): listed locations are strong-pay markets
     (employers that pay USD, EUR, or GBP). Remote roles paid in those currencies are
     in scope regardless of company country. `Anywhere` in `locations` is a wildcard,
     not a market: it keeps every location. Hire-from routes use `home_market`, never
     the job's own location.
   - Empty or missing `home_market` in `data/candidate.yaml` → list under Gaps
     (`home_market missing`); never invent a code. Home-market bucket labels and
     ranked `{home_market}-*` tables use the literal token `home_market` or skip
     those sections with `_(none)_` until set — do not default a country.
3. Run **every** pack in the resolved deck whose `enabled` is true or absent (file
   order). No other subset. Each `enabled: false` pack still gets a Query log row with
   verdict `skipped: disabled` — a pack is never silently absent from the report.

Print both blocks before any search. Pass both **verbatim** into every search brief —
they are the workers' only source for filters and for `[industry]`.

Phase 0 opens no page and signs in to nothing — the run's first network access is
Phase 1. A surface that answers signed-out is a Phase 1 defect
(`contract-search.md` step 1), never a preflight.

## Phase 1 — SEARCH (all packs)

For **each** pack: run `./references/<impl>.md` with
PROFILE_CARD + CONSTRAINTS + PACK + CONTRACT_SEARCH (`./references/contract-search.md`) **verbatim**.
When pack `entry` names a `data/sources.yaml` tier, resolve it and paste the selected rows
as **SOURCES** in the same brief, verbatim. Packs with a concrete URL `entry` get PACK only.

Do not summarize, do not substitute a field list.
A worker that was not given a constraint or guardrail cannot apply it.

Parallelism: `max_parallel` SSOT. Never two LI-session packs concurrent
(any pack whose `entry` host is `linkedin.com`). Launch up to `max_parallel` →
join → Phase 2 MERGE.
Every pack attempted (`auth_gate` is pack defect).
Expect `### Candidates` + `### Defect log` per unit (`### Contacts` +
`### Defect log` for people packs) — headings defined in `contract-search.md`.

## Phase 2 — MERGE (main only)

Pre-merge pack checker: `formulations_run` missing or <3 and no formulations defect and
verdict not `auth_gate` → `formulations_short`; candidates not merge-eligible until
re-run; main enforces. `auth_gate` packs: empty candidates merge-eligible; do not re-run
— the wall is not fixable from inside the run. Carry the actual `formulations_run`.
Every pack id must have Defect log row before extract.

Merge per `./references/contract-search.md` "URL normalize". One row per normalized URL.
Prefer non-`—` author; best channel per `## Channel sort`.
No company-dedupe here — a dead listing must not evict a live one from the same company.
Contacts side-channel only; never enter extract.

## Phase 3 — EXTRACT

Batch size = `extract_batch_size` from the resolved deck (SSOT). For each unique job URL
batch run `worker-extract`; people skip; independent batches may parallel up to
`max_parallel`; each batch opens URLs one at a time. Expect `### Verified`
rows — heading defined in `contract-extract.md`.

## Phase 4 — CONTRACT GATE (main)

Every row has every search key from `./references/contract-search.md` plus every extract key from
`./references/contract-extract.md`, whatever its status. Missing key → halt; name it under Gaps.
Never invent a field to pass the gate. Unknown = `—`.

### Location gate (post-extract, main)

Re-apply contract-search Location keep on extract-confirmed locations; deferred — becomes
keep/drop here; do not redefine keep rules in this file.

People contacts skip. Search-time keeps still apply; this gate closes the deferred path.

## Phase 5 — RANK + REPORT (main)

Drop dead from scored tables. Uncertain = unscored; lands under Gaps only;
never displace a scored row; never enter Do this first / home-market tables.
Location-gate drops already excluded above — do not score them.

REAL FIT = stack × geo/auth × salary.

Score ≥7 via `## Score`. Then `apply_once_at_company` on scored live rows (one per company,
highest score). Company losers → Dropped. Bucket per `## Bucket`.
Print the per-factor breakdown in `### Score audit`. A row whose factors do not sum to its
printed score is a defect: fix the row, do not adjust the sum.

Emit final markdown **exactly** per `./references/scout-report.md`. Named headings only. Then Phase 6.

## Phase 6 — PERSIST (main only) → STOP

**Writable SSOT for this skill.** Main writes; a worker never does. Only three
path shapes under Profile root: `scout/runs/*.md`, `scout/jobs/*.md`, and their
`*.md.tmp` staging siblings during atomic rename. Every other Profile-root path
(`data/`, `cv/`, …) is read-only. `mkdir -p` both stores on first run.

1. Resolve `scout/runs/`, `scout/jobs/`, and every file you are about to write to
   its physical path first, and **STOP** unless that path is still under the
   canonical Profile root. A store or dossier that is a symlink out of the tree
   passes every listability and parse check while the write lands somewhere else
   — the three writable path shapes above are a containment rule, not a spelling.
2. Write nothing until `scout/runs/` and `scout/jobs/` can be **listed**, and every
   existing dossier can be **read and parsed**. A store that is writable but not
   listable (or a dossier that will not parse) cannot answer which file a `url`
   already owns, which suffix that name carries, or what `status:` and
   `## Application log` it already holds — writing there overwrites the operator's
   application history with a fresh `status: new` under a second filename.
   Unreadable or unparseable → print the path under Gaps and STOP, same as a failed
   write.
3. Resolve the run filename: `scout/runs/{YYYY-MM-DD}-scout.md`, or `-2` / `-3`
   when that name is taken. Never overwrite an existing run file. Phase 5 already
   rendered that resolved name into its Snapshot `run` line, and the dossiers written
   below cite it in their `## Application log`. Resolving the name is not creating the
   file — the run record lands last, in step 6.
4. One dossier per row with `status=live` that passed the Phase 4 gate — including
   `score<7` and `apply_once_at_company` losers. A `dead` row that already has a
   dossier goes through the `dossier.md` re-run handler so its closure log is
   appended; `uncertain` rows, and `dead` rows never seen live, stay in the run
   report only and create no dossier.
5. Shape, filename, and the re-run rules are owned by `./references/dossier.md`.
6. Only once every dossier in step 4 is renamed into place, write the sections named
   by `./references/scout-report.md` `## Persisted subset` to the name resolved in
   step 3 — not the Phase 5 markdown verbatim. A ranked table or Score audit row in
   the run file is a defect: those columns are dossier-owned. Render it to a sibling
   `*.md.tmp` path under `scout/runs/` and rename it into place, and re-check the name
   is still free immediately before that rename, since deferring the write no longer
   reserves it. A run file is never overwritten, so its existence is the claim that
   its `Saved: {n} dossiers` line and `### Run manifest` rows are backed on disk.
   If the run file were written first, a dossier that dies partway — a full disk is
   enough — would leave a run record no retry can correct: the retry would take `-2`
   while the incomplete first file still reads as a valid run.
7. Unwritable path (permission, read-only FS) → print the error and the path under
   Gaps and STOP. Never fall back to another directory. A failed write is never silent.
   A dossier that fails in step 4 stops the phase before step 6, so no run file claims
   it: report the error in chat under Gaps, and leave `scout/runs/` untouched.

Then **STOP**.

## Score (0–10; keep ≥ 7)

| Factor                                                       | Points |
| ------------------------------------------------------------ | ------ |
| Skills / stack overlap                                       | 0–4    |
| Seniority match                                              | 0–2    |
| Geo/auth route fit (prefer printed work_auth + hiring_route) | 0–2    |
| Salary printed + in band                                     | 0–1    |
| Recency                                                      | 0–1    |

Salary point: USD awards 1 only if overlaps `salary_range_usd`; EUR/GBP factor 0 until
profile defines parity bands; other currencies 0; unprinted 0.

Geo/auth for remote: if work_model is remote and work_auth does not require a
jurisdiction the candidate lacks, do not zero geo solely because company country is
outside the locations list. Jurisdiction walls still bucket `EU/US-only` as today.

## Bucket (main-derived; never a gated column)

Derived here from extract output. NEVER set by a worker. First match wins.

| Printed on the JD                                                                                     | Bucket                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `hiring_route` names EOR / Deel / Oyster / "hire from anywhere"                                       | `{home_market}-EOR`                         |
| `hiring_route` names contractor / B2B, **or** `location` prints LATAM / global / anywhere / worldwide | `{home_market}-direct`                      |
| `work_auth` names a jurisdiction requirement, **or** `location` restricts to a country or region      | `EU/US-only` (blocker = the printed string) |
| none of the above                                                                                     | `unbucketed`                                |

`unbucketed` enters no ranked table. List under Gaps. Never guess a route from a company's
country. `{home_market}-EOR` is reachable only when `candidate.yaml`
`employment_routes.employer_of_record` is Yes.

Note: `{home_market}-friendly` = hire-from-home-market _route_, not the job's location.
`home_market` from `data/candidate.yaml` only — never invent; empty → Gaps (Phase 0).

## Channel sort (report tables)

`direct_email` → `dm_request` → `founder` → `ats`, then score desc.

---

## Anti-patterns

- Rank before merge+extract+gate
- Summarize CONSTRAINTS into a field list for workers
- Overwrite a dossier's `status:` or `## Application log` on a re-run
- Silent dry packs
- Write outside Phase 6 writable paths (see Phase 6 SSOT) or let a worker write
