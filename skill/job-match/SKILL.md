---
name: job-match
description: "Read this when you need to deep-rank scout dossiers, score one named dossier, or score one posting already in the conversation against MatchingPolicy. Returns a read-only fit report plus source-grounded resume guidance for displayed jobs. Not for searching (job-scout), printing scores as stored (job-list), or editing or generating a CV (job-resume-refine)."
argument-hint: "[--new | --all | --posting | --exclude <status>[,status…] | --top <n> | <dossier> | <auto-detect>]"
---

# Job match

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `scout/` and every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.

Write-set: none. Direct calls return chat only; worker and state JSON stay in-session.

Main is the orchestrator. Nodes, edges, and state live in the flow.

Skill-local files: `./references/*` and `./scripts/*.py` only. Resolve both
against the directory containing this loaded `SKILL.md`, never the caller's CWD.

Read `./references/flow-match.md` now.
Load each additional reference only when that flow names it.
