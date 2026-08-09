---
name: job-tracker
description: "Read this when you need to inspect the job scout store already on disk — dossiers under scout/jobs/, run reports under scout/runs/. Read-only; never writes. Use when the user asks what jobs do I have, which applications are open, or what did a scout run find. Not for drafting an application (job-application) or editing profile data (job-profile-config)."
---

# Job tracker

Profile root: resolve in order; print absolute path before any read; STOP if none.

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
   config path, walk start), then
   point at `job-profile-init` (**create new**, or **register existing** with
   Activate = Yes). Never scaffold a profile from here.

Resolve `scout/` against that root, not session CWD, not skill dir.

Print `Store: {root}/scout/runs/ · {root}/scout/jobs/` before answering.
`scout/` absent → say no run has persisted yet and stop; creating it is job-scout
Phase 6. `scout/` present but unreadable → **STOP** and name the path: absence means
there is nothing to read, a read failure means every answer would be wrong.

1. Read `./references/read.md` now; obey it end-to-end.
2. Dossiers under `scout/jobs/` are current state. Run files under `scout/runs/` are
   frozen snapshots — read them for what one run found, never for what is open now.
3. Print `score`, `bucket`, and posting facts as they sit on disk. Never re-score,
   never re-derive `bucket`, never open a posting URL to refresh a field.
4. Unparseable file under `scout/jobs/` → name it under Gaps and keep going. Never
   guess its fields, never repair it.
5. Deliver per `./references/views.md`, then **STOP**.

## References

- Reading the store: `./references/read.md` (dossier + run anatomy, ownership, staleness)
- Answer shapes: `./references/views.md` (all jobs, one job, status board, run diff)
