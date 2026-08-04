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

1. `$PROFILE_ROOT` if set and probe passes. Session-only override — coding-agent
   `export` from `/job-profile-init` does **not** appear here unless Aside (or
   the operator) set it for **this** process.
2. File `$HOME/.config/profile-root` (one absolute path line, trim newline). If
   the line is non-empty, probe that path. Activate mirrors into Aside runtime
   home so sandboxed `$HOME` often hits this step.
3. **Aside dual-home:** if `$HOME` is exactly or ends with
   `/.aside/runtime/home`, also try the **host** pointer:
   - `HOST_HOME` = `${HOME%/.aside/runtime/home}` when that strip shortens
     `$HOME`; else `$HOST_HOME` env if set and absolute.
   - Read `$HOST_HOME/.config/profile-root` (one absolute path line) and probe.
   - `/job-profile-init` Activate writes this host file; runtime mirror covers
     step 2 when present.
4. Walk session CWD upward until probe passes.
5. else STOP. Name each attempt (env, each pointer file + line, walk start).
   Recovery (in order operators can try):
   - Set `PROFILE_ROOT=/absolute/path/to/profile` for this Aside session (path
     must pass probe **and** be readable inside Aside's FS sandbox).
   - Grant Aside filesystem access to that profile directory (macOS sandbox).
   - Re-run `/job-profile-init` with Activate **Yes** (or profile
     `scripts/install.sh`) so host + Aside-runtime pointer files match the live
     profile.
   - Do **not** tell operators that bare `bash scripts/install.sh` from Aside
     CWD alone fixes a missing host pointer without a real profile path.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `data/search_packs.yaml` under Profile root.

1. Read `./references/pipeline.md` now; obey it end-to-end.
2. Phase 1: paste `./references/contract-search.md` verbatim into every search brief.
3. Phase 3: paste `./references/contract-extract.md` verbatim into every extract brief.
4. Run **every** pack in `data/search_packs.yaml` (Profile root), YAML order. No subset.
5. Browser/web tools only as phases allow. Never apply, message, connect, or edit the repo.
6. No invent. Evidence staging is law. See the two contract cards.
7. Deliver the report exactly per `./references/scout-report.md`, then STOP.

## References

- Pipeline: `./references/pipeline.md` (phases, score, bucket, gate)
- Scout report: `./references/scout-report.md` (sections, columns, vocab; main-only)
- Search contract: `./references/contract-search.md` (paste card; never inherited)
- Extract contract: `./references/contract-extract.md` (paste card; never inherited)
- Search surfaces: `./references/surface-{linkedin-jobs,open-web,social,people}.md` (surface deltas)
- Extract worker: `./references/worker-extract.md` (open JD → facts / dead / uncertain)
- Search packs: `data/search_packs.yaml` under Profile root (every pack, YAML order)
