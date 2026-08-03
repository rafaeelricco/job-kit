---
name: "job-discovery"
description: "List-only job scout across every search pack. Never apply, message, connect, or edit the repo. Use when the user asks to find jobs, scout openings, run job discovery, or produce a job scout report; stop after the report."
---

# Job discovery

Profile root: resolve in order; print absolute path before any work; STOP if none:

1. `$PROFILE_ROOT` if dir has `data/candidate.yaml` and `data/job_search.yaml`
2. `~/.config/profile-root` (one absolute path line) if same probe passes
3. Walk session CWD upward until both probe files exist
4. else STOP; name attempts; tell operator to run profile `scripts/install.sh` or set PROFILE_ROOT

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `data/search_packs.yaml` under Profile root.

1. Read `./references/orchestrator.md` now; obey it end-to-end.
2. Phase 1: paste `./references/contract.worker.md` verbatim into every search brief.
3. Phase 3: paste `./references/contract.extract.md` verbatim into every extract brief.
4. Run **every** pack in `data/search_packs.yaml` (Profile root), YAML order. No subset.
5. Browser/web tools only as phases allow. Never apply, message, connect, or edit the repo.
6. No invent. Evidence staging is law. See the two contract cards.
7. Deliver the report exactly per `./references/report-format.md`, then STOP.

## References

- Orchestrator: `./references/orchestrator.md` (phases, score, bucket, gate)
- Report format: `./references/report-format.md` (sections, columns, vocab; main-only)
- Search contract: `./references/contract.worker.md` (paste card; never inherited)
- Extract contract: `./references/contract.extract.md` (paste card; never inherited)
- Search surfaces: `./references/search-{jobs-board,open-web,social,people}.md` (surface deltas)
- Extract surface: `./references/extract-jd.md` (open JD → facts / dead / uncertain)
- Search packs: `data/search_packs.yaml` under Profile root (every pack, YAML order)
