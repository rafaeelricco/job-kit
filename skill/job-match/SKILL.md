---
name: job-match
description: "Read this when you need to deep-rank existing scout dossiers against one shared MatchingPolicy — hard filters then 0–100 scores with evidence. Chat report only; never writes dossiers or scout score. Use when the user runs /job-match, asks which scout jobs really fit, or wants a deeper rank than skills-overlap. Not for searching (job-scout), printing scores as stored (job-list), or per-ad Fit tables (job-apply)."
---

# Job match

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `scout/` and every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.

Write-set: none. Chat report only.

Skill-local files: `./references/*` only.

Read `./references/flow-match.md` now.
Load each additional reference only when that flow names it.
