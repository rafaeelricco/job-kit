---
name: job-store
description: "Read this when you need dossier schema, persistence lock, or untrusted-read law for scout/jobs/. Use when another job-* skill says to load job-store. Not for listing views (job-list), searching (job-scout), or applying (job-apply)."
---

# Job store

Load-path only. No verb, no Profile-root probe, no glob, no view.

Caller already resolved Profile root. This skill does not print `Profile root:` or `Store:`.

Skill-local files: `./references/**` only.

Read now, in order:

1. `./references/schemas/schema-dossier.md`
2. `./references/contracts/contract-persistence.md`
3. `./references/flows/flow-read.md`

Obey all three end-to-end. Load no other file from this skill unless a caller names it.
