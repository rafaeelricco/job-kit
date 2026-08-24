---
name: job-apply
description: "Prepare one job application from a posting, then submit it and record only confirmed submission. Use for cover letters, application forms, and Easy Apply; not for reply tracking."
---

# Job application

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every profile path against Profile root (not CWD, not skill dir).
Skill-local files: `./references/*` only.

One posting at a time.

When the operator message is explicit `sent`, `submitted`, or `applied`
confirmation, read `./references/flow-record.md` now.
Otherwise read `./references/flow-prepare.md` now.
Load each additional reference only when that flow names it.
