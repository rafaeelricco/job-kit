---
name: profile-scaffold
description: "Scaffold a new job-search profile checkout: Fact-law YAML shells, search packs skeleton, private stub, and profile-root install scripts. Never imports LinkedIn or a resume; never copies donor private data. Use when the user runs /profile-scaffold, asks to scaffold a profile, create a profile for job skills, or set up job discovery data for someone new."
---

# Profile scaffold

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/` or `private/`. Materialize only from `./templates/`.
Do not copy job-discovery or job-apply skill trees into the profile.

1. Read `./wizard.md` now; ask one free-text question at a time in that order.
2. On confirm, obey `./materialize.md` end-to-end (write → rewrite tokens → leak gate).
3. Print `./fill-checklist.md` verbatim, then offer `bash scripts/install.sh -y`
   inside the new target. STOP.

## References

- Wizard: `./wizard.md` (questions, defaults, stop rules)
- Materialize: `./materialize.md` (tree map, tokens, leak gate)
- Fill checklist: `./fill-checklist.md` (what the operator fills after scaffold)
- Templates: `./templates/` (only allowed source tree; never live donor data)
