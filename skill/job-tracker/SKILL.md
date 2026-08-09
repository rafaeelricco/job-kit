---
name: job-tracker
description: "Read this when you need to inspect the job scout store already on disk — dossiers under scout/jobs/, run reports under scout/runs/. Read-only; never writes. Use when the user asks what jobs do I have, which applications are open, or what did a scout run find. Not for drafting an application (job-application) or editing profile data (job-profile-config)."
---

# Job tracker

Profile root: **same ordered resolver as job-scout** — obey `job-scout/SKILL.md`
Profile root steps (SSOT). Recovery essay: `job-scout/references/profile-root.md`.
Print the absolute root before any read; STOP if none resolves, naming each attempt.
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
