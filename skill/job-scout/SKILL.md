---
name: job-scout
description: "Read this when you need a list-only job scout across every search pack. Never apply, message, connect, or edit the repo. Use when the user asks to find jobs, scout openings, run job scout, or produce a job scout report; stop after the report."
---

# Job scout

Profile root: resolve in order; print absolute path before any work; STOP if none.

**Probe** (must all pass for a candidate dir): directory exists and is readable;
contains `data/candidate.yaml` and `data/job_search.yaml`. Unreadable dir
(sandbox `Operation not permitted`, missing path) → treat as fail for that
candidate; try the next step. Do not invent a profile path.

1. `$PROFILE_ROOT` if set and probe passes.
2. File `$HOME/.config/profile-root` (one absolute path line); probe if non-empty.
3. **Aside dual-home:** if `$HOME` is exactly or ends with `/.aside/runtime/home`,
   also try host pointer: `HOST_HOME` = strip that suffix (else `$HOST_HOME` env if
   absolute); read `$HOST_HOME/.config/profile-root` and probe.
4. Walk session CWD upward until probe passes.
5. else STOP. Name each attempt (env, each pointer file + line, walk start).
   Recovery detail: `./references/profile-root.md` (load on STOP or step 2–3 fail).

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `./references/search_packs.yaml` (skill-local; not under Profile root).

1. Read `./references/pipeline.md` now; obey it end-to-end.
2. Phase 1: paste `./references/contract-search.md` verbatim into every search brief.
3. Phase 3: paste `./references/contract-extract.md` verbatim into every extract brief.
4. Pack list, parallelism, gates, score: pipeline only. Contracts own list-only + evidence.
5. Deliver report per `scout-report.md`, then STOP.

## References

- Pipeline: `./references/pipeline.md` (phases, score, bucket, gate)
- Scout report: `./references/scout-report.md` (sections, columns, vocab; main-only)
- Search contract: `./references/contract-search.md` (paste card; never inherited)
- Extract contract: `./references/contract-extract.md` (paste card; never inherited)
- Search surfaces: `./references/surface-{linkedin-jobs,open-web,social,people}.md` (surface deltas)
- Extract worker: `./references/worker-extract.md` (open JD → facts / dead / uncertain)
- Search packs: `./references/search_packs.yaml` (every pack, YAML order)
- Profile root recovery: `./references/profile-root.md` (Aside dual-home; not step SSOT)
