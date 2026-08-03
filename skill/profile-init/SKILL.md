---
name: profile-init
description: "Scaffold a new job-search profile checkout: Fact-law YAML shells, search packs skeleton, private stub, and profile-root install scripts. Never imports LinkedIn or a resume; never copies donor private data. Use when the user runs /profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/` or `private/`. Materialize only from `./templates/`.
Do not copy job-scout or application-stage skill trees into the profile.

1. Read `./intake.md` now; ask one free-text question at a time in that order.
2. On confirm, obey `./emit-tree.md` end-to-end (write → rewrite tokens → leak gate).
3. Print `./next-steps.md` verbatim, then offer `bash scripts/install.sh -y`
   inside the new target. STOP.

## References

- Intake: `./intake.md` (questions, defaults, stop rules)
- Emit tree: `./emit-tree.md` (tree map, tokens, leak gate)
- Next steps: `./next-steps.md` (what the operator fills after scaffold)
- Templates: `./templates/` (only allowed source tree; never live donor data)
