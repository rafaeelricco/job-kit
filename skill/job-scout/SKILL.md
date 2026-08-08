---
name: job-scout
description: "Read this when you need a list-only job scout across every search pack. Never apply, message, connect, or edit the kit repo; writes only the profile's scout/ dossier tree. Use when the user asks to find jobs, scout openings, run job scout, or produce a job scout report; stop after the report and its dossier."
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
   probe when not already tried. Explicit Activate/install wins over path
   convention so a non-default active profile is not shadowed by residual
   files under the default config dir.
4. **Default config dirs** (probe each not already tried):
   - `JOB_KIT_CONFIG`: non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
     else `$HOME/.config/job-kit`.
   - **Host-default fallback:** `$HOST_HOME/.config/job-kit` where `HOST_HOME`
     is from step 3 when dual-home, else strip `/.aside/runtime/home` from
     `$HOME` or use `$HOME`. Probe when that path differs from `JOB_KIT_CONFIG`.
     Always probe host-default so a profile there stays resolvable across Aside
     (often no XDG) and coding agents (may set XDG elsewhere) without a pointer.
5. Walk session CWD upward until probe passes.
6. else STOP. Name each attempt (env, each pointer file + line, each default
   config path, walk start).
   Recovery detail: `./references/profile-root.md` (load on STOP or step 2–4 fail).

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` only.
Pack list: `data/search_packs.yaml` under Profile root; absent → fall back to
`./references/search_packs.yaml` (kit deck). Never merge the two.

Writable here: `scout/runs/*.md` and `scout/jobs/*.md` under Profile root, main
thread only, Phase 6 only. Every other path under Profile root — all of `data/`
and `cv/` — is read-only in this skill. Workers never write.

1. Read `./references/pipeline.md` now; obey it end-to-end.
2. Phase 1: paste `./references/contract-search.md` verbatim into every search brief.
3. Phase 3: paste `./references/contract-extract.md` verbatim into every extract brief.
4. Pack list, parallelism, gates, score: pipeline only. Contracts own list-only + evidence.
5. Deliver report per `scout-report.md`.
6. Persist the run and one dossier per live job per `dossier.md`, then STOP.

## References

- Pipeline: `./references/pipeline.md` (phases, score, bucket, gate)
- Scout report: `./references/scout-report.md` (sections, columns, vocab; main-only)
- Dossier: `./references/dossier.md` (scout/ layout, file format, re-run rules; main-only)
- Search contract: `./references/contract-search.md` (paste card; never inherited)
- Extract contract: `./references/contract-extract.md` (paste card; never inherited)
- Search surfaces: `./references/surface-{linkedin-jobs,open-web,social,people}.md` (surface deltas)
- Extract worker: `./references/worker-extract.md` (open JD → facts / dead / uncertain)
- Search packs: `data/search_packs.yaml`, else `./references/search_packs.yaml`
  (every enabled pack, YAML order)
- Profile root recovery: `./references/profile-root.md` (Aside dual-home; not step SSOT)
