---
name: job-scout
description: "Read this when you need to find job openings across operator-chosen search packs and produce a scout report plus one dossier per live job. Use when the user asks to find jobs, scout openings, look for roles, see what is hiring, run job scout, refresh the job search, or produce a scout report. List-only: it never applies, messages, or connects, and writes only the profile's scout/ tree. Not for drafting or submitting an application (job-apply), reading dossiers already on disk (job-list), checking application email (job-inbox), or changing search config (job-profile-me)."
---

# Job scout

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `data/search_packs.yaml` under Profile root; absent → fall back to
`./references/search_packs.yaml` (kit deck). Never merge the two.

Writable paths: Phase 6 only (`./references/flow-scout.md` — Writable SSOT).

1. Read `./references/flow-scout.md` now; obey it end-to-end.
2. Phase 1: paste `./references/contract-search.md` verbatim into every search brief.
3. Phase 3: paste `./references/contract-extract.md` verbatim into every extract brief.
4. Pack list, parallelism, gates, score: flow-scout only. Contracts own list-only + evidence.
5. Deliver report per `format-report.md`.
6. Persist one dossier per live job per `schema-dossier.md`, then STOP.

## References

- Pipeline: `./references/flow-scout.md` (phases, score, bucket, gate)
- Scout report: `./references/format-report.md` (sections, columns, vocab; main-only)
- Dossier: `./references/schema-dossier.md` (scout/ layout, file format, re-run rules; main-only)
- Search contract: `./references/contract-search.md` (paste card; never inherited)
- Extract contract: `./references/contract-extract.md` (paste card; never inherited)
- Search surfaces: `./references/worker-search-{linkedin-jobs,open-web,social}.md` (surface deltas)
- Extract worker: `./references/worker-extract.md` (open JD → facts / dead / uncertain)
- Search packs: `data/search_packs.yaml`, else `./references/search_packs.yaml`
  (enabled packs, YAML order; chosen set: flow-scout Phase 0)
