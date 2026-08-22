---
name: job-resume
description: "Use when the user runs /job-resume, asks for a tailored résumé or CV PDF against one scout dossier, a one-page LaTeX resume for a posting, or a match-report; also when job-apply Prepare spawns this skill for a status:new dossier. Not for submitting an application (job-apply), ranking openings (job-scout), or editing Fact YAML (job-profile-me)."
---

# Job resume

One posting. One page. Truth from Fact files; the JD is relevance only.

May be entered from `job-apply` Prepare as an isolated `spawn_subagent`
(Argument: `{filename}`, `PROFILE_ROOT`). This agent is still resume main:
it sequences phases, may call `./scripts/compile.sh`, and may spawn Loop A.
It never submits an application. Phase 6 FAIL / Phase 7 PASS still **STOP**
this agent.

Profile root: load the `job-profile-root` skill now.

Resolve every `data/*`, `cv/`, and `scout/` path against Profile root (not CWD, not skill dir).
Unreadable required Fact file under a resolved root → stop and say so.
Skill-local files: `./references/*` and `./scripts/compile.sh` only.

Writes only `scout/applications/`. Never `data/`, `cv/`, `scout/jobs/`.

Read `./references/flow-resume.md` now.
Load each additional reference only when that flow names it.

## References

- Pipeline: `./references/flow-resume.md` (main-only)
- Page contract: `./references/contract-resume.md` (paste card)
- Verify worker: `./references/worker-verify.md`
- Disk write law: `./references/schema-report.md` (main-only)
- Loop B CLI: `./scripts/compile.sh` (main is the only caller)
