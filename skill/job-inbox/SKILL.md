---
name: job-inbox
description: "Read this when you need to check Gmail for replies to tracked applications and write lifecycle status onto scout/jobs/ dossiers when evidence is strong. Never sends mail; never creates a dossier. Use when the user runs /job-inbox, asks if anyone replied, check application email, update status from inbox, or scan for interview / rejection / offer mail. Not for drafting an application (job-apply) or listing dossiers without mail (job-list)."
---

# Job inbox

Load `job-profile-root`. Resolve `scout/` and `data/*` against Profile root
(not CWD, not skill dir). Unreadable required file → stop and say so.

Skill-local: `./references/*` only.

Read `./references/flow-inbox.md` now.
Load each additional reference only when that flow names it.
