---
name: job-resume
description: "Use when the user runs /job-resume, asks for a tailored résumé or CV PDF against one scout dossier, a one-page LaTeX resume for a posting, or a match-report; also when job-apply Prepare spawns this skill for a status:new dossier. Not for submitting an application (job-apply), ranking openings (job-scout), or editing Fact YAML (job-profile-me)."
---

# Job resume

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*`, `cv/`, and `scout/` path against Profile root.

Skill-local files: `./references/*` only.

Read `./references/flow-resume.md` now.
Load each additional reference only when that flow names it.
