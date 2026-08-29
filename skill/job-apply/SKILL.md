---
name: job-apply
description: "Apply to one job posting: read the ad, attach the right CV, fill the form, submit, and record the confirmed submission. Use when the user runs /job-apply, says apply to this posting, fill this application, or confirms sent/submitted/applied. The decision to apply is already made; never re-judge the posting. Not for searching (job-scout), scoring a posting (job-match), tailoring a CV alone (job-resume-refine), or reply tracking (job-inbox)."
---

# Job application

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every profile path against Profile root (not CWD, not skill dir).
Skill-local files: `./references/*` only.

Write-set: `scout/jobs/` only, and only after a confirmed submission.

One posting at a time. The operator already decided to apply. Never re-judge the
posting, score the fit, or argue the decision.

When the operator message is explicit `sent`, `submitted`, or `applied`
confirmation, read `./references/flow-record.md` now.
Otherwise read `./references/flow-apply.md` now.
Load each additional reference only when that flow names it.
