---
name: job-match
description: "Read this when you need to deep-rank scout dossiers, or score one posting already in the conversation, against one MatchingPolicy. Chat report only; never writes dossiers or scout score. Use when the user runs /job-match, asks which scout jobs really fit, or to match a JD already on screen. Not for searching (job-scout), printing scores as stored (job-list), or per-ad CV hit/miss (job-resume-refine)."
argument-hint: "[--new | --all | --posting | --exclude <status>[,status…] | <auto-detect>]"
---

# Job match

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `scout/` and every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.

Write-set: none. Chat report only.

Main is the orchestrator. Nodes, edges, and state live in the flow.

Skill-local files: `./references/*` only.

Read `./references/flow-match.md` now.
Load each additional reference only when that flow names it.
