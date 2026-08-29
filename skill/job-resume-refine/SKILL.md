---
name: job-resume-refine
description: "Read this when you need a one-page resume tailored to one scout dossier by re-selecting which experiences.yml bullets print. Selects, never rewrites — no bullet text is authored, the Summary is recomposed from the same Facts, and no Fact is invented. Use when the user runs /job-resume-refine or asks for a tailored resume or CV PDF for a posting. Not for submitting an application (job-apply), ranking openings (job-scout), or editing Fact YAML (job-profile-me)."
---

# Job resume refine

Picks which already-written bullets print, and recomposes the Summary from the
same Facts. It never writes a bullet, a skill token, or any Fact — `data/` and
the base `.tex` own those.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `data/`, `cv/`, and `scout/` against that root.

Writes `scout/applications/{slug}/` only. `data/` and `cv/` stay read-only.

Skill-local files: `./references/*` only.

Read `./references/flow-refine.md` now.
Load each additional reference only when that flow names it.
