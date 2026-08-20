---
name: job-scout
description: "Find and rank live job openings from operator-selected search packs, report results, and persist scout dossiers. List-only: never applies or contacts. Not for dossier reading, applications, inbox triage, or profile configuration."
---

# Job scout

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.

Read `./references/flow-scout.md` now.
Load each additional reference only when that flow names it.

## References

- Pipeline: `./references/flow-scout.md`
- Scout report: `./references/rank-report.md` (main-only)
- Kit-gate: `./references/contract-check.md` (main-only)
- Dossier: `./references/schema-dossier.md` (main-only)
- Search contract: `./references/contract-search.md` (paste card)
- Extract contract: `./references/contract-extract.md` (paste card)
- Browse contract: `./references/contract-browse.md`
- Search surfaces: `./references/worker-search-{linkedin-jobs,open-web,social}.md`
- Extract worker: `./references/worker-extract.md`
- Search packs: `data/search_packs.yaml`, else `./references/search_packs.yaml`
