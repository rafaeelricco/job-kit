---
name: job-scout
description: "Find and rank live job openings from operator-selected search packs, report results, and persist scout dossiers. List-only: never applies or contacts. Not for dossier reading, applications, inbox triage, or profile configuration."
---

# Job scout

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `data/search_packs.yaml` under Profile root; absent → fall back to
`./references/search_packs.yaml` (kit deck). Never merge the two.

Read `./references/flow-scout.md` now.
Load each additional reference only when that flow names it.
Workers receive the shared browse contract, their mode contract, and only their
selected surface delta.
Writes occur only in Phase 6 under the persistence and dossier contracts.

## References

- Pipeline: `./references/flow-scout.md` (phases, score, bucket, gate)
- Scout report: `./references/rank-report.md` (score, bucket, sections, columns, vocab; main-only)
- Dossier: `./references/schema-dossier.md` (scout/ layout, file format, re-run rules; main-only)
- Search contract: `./references/contract-search.md` (paste card; never inherited)
- Extract contract: `./references/contract-extract.md` (paste card; never inherited)
- Browse contract: `./references/contract-browse.md` (shared page-access gate)
- Search surfaces: `./references/worker-search-{linkedin-jobs,open-web,social}.md` (surface deltas)
- Extract worker: `./references/worker-extract.md` (open JD → facts / dead / uncertain)
- Search packs: `data/search_packs.yaml`, else `./references/search_packs.yaml`
  (enabled packs, YAML order; chosen set: flow-scout Phase 0)
