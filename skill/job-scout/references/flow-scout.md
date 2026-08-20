# Job scout — pipeline

Paths are relative to the Profile root from the `job-profile-root` skill.
Resolve every `data/*` path against that root, not session CWD.
Skill-local files live under `./references/` next to `SKILL.md`.
Load phase-specific references only when their phase begins.
You sequence phases. Workers search/extract only. You merge, gate, rank, report.
Do not invent jobs or company facts.

Never paste any part of this file into a worker brief. The two paste cards carry every
rule a worker needs.

## Mode: list only

Finds and reports jobs. Never applies, messages, or connects. Use the operator's
existing browser session; a required login or signup gate is an operator action.
Listing and extract are the only things that gate completion can enable. Done when
the Report ships and Phase 6 has written every dossier it must → **STOP**.

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

Load `./references/contract-browse.md` and `./references/contract-search.md` once.
For **each** chosen pack, load only `./references/worker-search-<surface>.md` and
run it with PROFILE_CARD + CONSTRAINTS + PACK + both contracts **verbatim**, then
append the selected surface delta. Do not run a pack when either `surface` names no
`worker-search-*.md` in this skill or `entry` is not one `http(s)` URL. Main emits
empty `### Candidates`, then `### Defect log` with this contract-shaped Defect row:
`{id} | 0 | 0 | defect: unsupported_pack {id}`.
A profile deck is never rewritten by an update, and
`/job-profile-me` checks `surface` but not `entry` shape, so a deck can still
carry a legacy source-row list, or a `from data/sources.yaml <group>` entry it no
longer resolves. Both run silently — an unresolvable entry reports as a dry pack,
which is the same string a healthy-but-empty pack emits. Keep the migration
explanation under Gaps: give each source row its own pack with that row's URL as
`entry`, or drop the pack.

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

Pre-merge pack checker: `formulations_run` missing or less than the pack's
formulation count with `verdict=pass`, or with nonempty candidates →
`formulations_short`; candidates not merge-eligible until re-run; main enforces.
An empty candidate set whose verdict already names `auth_gate` or a defect is
terminal and merge-eligible as an empty set. Carry the actual
`formulations_run`.
Every chosen pack id must have Defect log row before extract.

Merge per `./references/contract-search.md` "URL normalize". One row per normalized URL.
Prefer non-`—` author; best channel per `rank-report.md` `## Channel sort`.

## Phase 3 — EXTRACT

Load `./references/contract-browse.md`, `./references/contract-extract.md`, and
`./references/worker-extract.md`.
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

Load `./references/rank-report.md` and `./references/contract-check.md`.
Apply its hard-contradiction drop first, then its score, bucket, eligibility,
ordering, and exact rendering contracts to the rows that survive. A row whose factors do not sum to its printed score is a defect: fix
the row, do not adjust the sum. Then Phase 6.

## Phase 6 — PERSIST (main only) → STOP

**Writable SSOT for this skill.** Main writes; a worker never does. Only these
path shapes under Profile root: `scout/jobs/*.md`, exclusive lock directories
`scout/jobs/*.lock` (create via `mkdir`, remove when the write finishes — see
`persistence.md`), lock metadata `scout/jobs/*.lock/owner`, and
lock-internal place staging `scout/jobs/*.lock/place-*`.
Every other Profile-root path (`data/`, `cv/`, …) is read-only. Never create,
write, list-require, or delete `scout/runs/` — an orphan from an older
revision is ignored.

Load `./references/schema-dossier.md` and `./references/persistence.md`.
Validate that `scout/jobs/` is listable and every existing dossier parses before
starting the first transaction. Every filesystem mutation uses `persistence.md`.
One dossier per row with `status=live` that passed the Phase 4 gate and the
Phase 5 hard-contradiction drop — including `score<7` rows. A `kit drop` row
never gets one, whatever it scored: it is not a job this profile can take. A `dead` row that already has a
dossier goes through the `schema-dossier.md` re-run handler so its closure log is
appended; `uncertain` rows stay in chat Gaps only and create no dossier;
`dead` rows never seen live create no dossier and are not listed in chat.
Shape and re-run semantics come from `schema-dossier.md`; every filesystem mutation
uses `persistence.md`. Unwritable path (permission, read-only FS) → print the error and the path under
Gaps and STOP. Never fall back to another directory. A failed write is never silent.
A dossier that fails stops the phase; report the error in chat under Gaps.

Then **STOP**.
