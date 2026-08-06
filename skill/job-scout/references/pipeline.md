# Job scout — pipeline

Paths are relative to the Profile root from `SKILL.md` (ordered resolver in SKILL.md).
Resolve every `data/*` path against that root, not session CWD.
Skill-local files live under `./references/` next to `SKILL.md`.
You sequence phases. Workers search/extract only. You merge, gate, rank, report.
Do not invent jobs or company facts.

Never paste any part of this file into a worker brief. The two paste cards carry every
rule a worker needs.

## Mode: list only

Finds and reports jobs. Never acts on them. Done when the Report ships → **STOP**.

## Inputs (read-only)

| Path                                                                             | Supplies                                                        |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `data/candidate.yaml`                                                            | salary, work auth, employment_routes, relocation                |
| `data/job_search.yaml`                                                           | positions, keywords, filters, blacklists, apply_once_at_company |
| `data/sources.yaml`                                                              | tiers, access, channels                                         |
| `./references/search_packs.yaml`                                                 | every pack, YAML order (skill-local)                            |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml`, `skills-by-company.yml` | card                                                            |

Glob `data/*.{yaml,yml}`. Conflict: candidate wins people prefs; job_search wins filters — note it.

## Phase 0 — preflight + context (main)

1. Resolve Profile root per SKILL.md; print `Profile root: /abs/path`. Probe
   `data/candidate.yaml` and `data/job_search.yaml` under that root. Probe
   `./references/search_packs.yaml` next to this skill. Any missing → STOP, name the file.
2. LinkedIn session → identity must equal LinkedIn `username` in
   `data/profiles.yaml` under Profile root. Probe LI identity once; fail → packs
   surface `linkedin_*` OR pack id `people-ta` return zero + defect `auth_gate`;
   do NOT STOP run; non-LI packs still run.
3. Read inputs → print `### Profile card` and `### Constraints`.
   - Profile card: primary role · seniority · top skills · industries · languages · target stack
   - Constraints: work model · experience level · job types · positions · keywords · locations ·
     blacklists · date_posted · salary_range_usd · work auth · employment_routes · relocation
   - Markets intent (prose in Constraints): listed locations are strong-pay markets
     (employers that pay USD, EUR, or GBP). Remote roles paid in those currencies are
     in scope regardless of company country. Home-market countries in `location_blacklist`
     are job-location only; hire-from routes use `home_market`.
4. Run **every** pack listed in `./references/search_packs.yaml` (file order). No subset.

Print both blocks before any search. Pass both **verbatim** into every search brief —
they are the workers' only source for filters and for `[industry]` / `[company]`.

## Phase 1 — SEARCH (all packs)

For **each** pack: run `./references/<impl>.md` with
PROFILE_CARD + CONSTRAINTS + PACK + CONTRACT_SEARCH (`./references/contract-search.md`) **verbatim**.
When pack `entry` names a `data/sources.yaml` tier, resolve it and paste the selected rows
as **SOURCES** in the same brief, verbatim. Packs with a concrete URL `entry` get PACK only.

Do not summarize, do not substitute a field list.
A worker that was not given a constraint or guardrail cannot apply it.

Parallelism: `max_parallel` SSOT. Never two LI-session packs concurrent
(`linkedin_*` or `people-ta`). Launch up to `max_parallel` → join → Phase 2 MERGE.
Every pack attempted (`auth_gate` is pack defect).
Each unit prints `### Candidates` + `### Defect log` (or Contacts for people).

## Phase 2 — MERGE (main only)

Pre-merge pack checker: `formulations_run` missing or <3 and no formulations defect →
`formulations_short`; candidates not merge-eligible until re-run; main enforces; every
pack id must have Defect log row before extract.

Merge per `./references/contract-search.md` "URL normalize". One row per normalized URL.
Prefer non-`—` author; best channel per `## Channel sort`.
No company-dedupe here — a dead listing must not evict a live one from the same company.
Contacts side-channel only; never enter extract.

## Phase 3 — EXTRACT

Batch size = `extract_batch_size` from `search_packs.yaml` SSOT. For each unique job URL
batch run `worker-extract`; people skip; independent batches may parallel up to
`max_parallel`; each batch opens URLs one at a time. Emit `### Verified` rows.

## Phase 4 — CONTRACT GATE (main)

Every row has every search key from `./references/contract-search.md` plus every extract key from
`./references/contract-extract.md`, whatever its status. Missing key → halt; name it under Gaps.
Never invent a field to pass the gate. Unknown = `—`.

### Location gate (post-extract, main)

Re-apply contract-search Location keep on extract-confirmed locations; deferred — becomes
keep/drop here; do not redefine keep rules in this file.

People contacts skip. Search-time keeps still apply; this gate closes the deferred path.

## Phase 5 — RANK + REPORT (main) → STOP

Drop dead from scored tables. Uncertain = unscored; lands under Gaps only;
never displace a scored row; never enter Do this first / home-market tables.
Location-gate drops already excluded above — do not score them.

REAL FIT = stack × geo/auth × salary.

Score ≥7 via `## Score`. Then `apply_once_at_company` on scored live rows (one per company,
highest score). Company losers → Dropped. Bucket per `## Bucket`.
Print the per-factor breakdown in `### Score audit`. A row whose factors do not sum to its
printed score is a defect: fix the row, do not adjust the sum.

Emit final markdown **exactly** per `./references/scout-report.md`. Named headings only. Then **STOP**.

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

Note: `location_blacklist` = job _location_; `{home_market}-friendly` = hire-from-home-market _route_. `home_market` from `data/candidate.yaml` (default `BR` if empty).

## Channel sort (report tables)

`direct_email` → `dm_request` → `founder` → `ats`, then score desc.

---

## Anti-patterns

- Invent postings or fields
- Rank before merge+extract+gate
- Summarize CONSTRAINTS into a field list for workers
- Apply / message / connect / edit repo
- Silent dry packs
