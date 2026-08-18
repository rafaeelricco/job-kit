---
name: job-scout
description: "Read this when you need to find job openings across operator-chosen search packs and produce a scout report plus one dossier per live job. Use when the user asks to find jobs, scout openings, look for roles, see what is hiring, run job scout, refresh the job search, or produce a scout report. List-only: it never applies, messages, or connects, and writes only the profile's scout/ tree. Not for drafting or submitting an application (job-apply), reading dossiers already on disk (job-list), or changing search config (job-profile-me)."
---

# Job scout

Profile root: resolve in order; print absolute path before any work; STOP if none.

**Probe** (must all pass for a candidate dir): directory exists and is readable;
contains `data/candidate.yaml` and `data/job_search.yaml`. Unreadable dir
(sandbox `Operation not permitted`, missing path) → treat as fail for that
candidate; try the next step. Do not invent a profile path.

1. `$PROFILE_ROOT` if set and probe passes.
2. File `$HOME/.config/profile-root` (one absolute path line); probe if non-empty.
3. **Aside dual-home pointer:** if `$HOME` is exactly or ends with
   `/.aside/runtime/home`, compute host `HOST_HOME` (strip suffix, else
   `$HOST_HOME` env if absolute) and read `$HOST_HOME/.config/profile-root`;
   probe when not already tried.
4. **Default config dirs** (probe each not already tried):
   - `JOB_KIT_CONFIG`: non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
     else `$HOME/.config/job-kit`.
   - **Host-default fallback:** `$HOST_HOME/.config/job-kit` where `HOST_HOME`
     is from step 3 when dual-home, else strip `/.aside/runtime/home` from
     `$HOME` or use `$HOME`. Probe when that path differs from `JOB_KIT_CONFIG`.
5. Walk session CWD upward until probe passes.
6. else STOP. Name each attempt (env, each pointer file + line, each default
   config path, walk start).
   Recovery detail: `./references/flow-recover-root.md` (load on STOP or step 2–4 fail).

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
- Profile root recovery: `./references/flow-recover-root.md` (Aside dual-home; not step SSOT)
