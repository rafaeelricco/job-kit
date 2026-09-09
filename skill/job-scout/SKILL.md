---
name: job-scout
description: "Find and rank live job openings from operator-selected search packs or ad-hoc site URLs, report results, and persist scout dossiers. List-only. Use when the user runs /job-scout or asks to find, search, or scout openings. Not for dossier reading (job-list), applications (job-apply), inbox triage (job-inbox), or profile configuration (job-profile-me)."
argument-hint: "[all | <pack-id>…] [<url>…] | --refresh"
---

# Job scout

Profile: load `job-profile-me`'s read path — it obeys `job-profile-root`
end-to-end (a root STOP = no profile → STOP here) and owns the read set and
card derivation (`job-profile-me/references/flows/flow-show.md`,
`job-profile-me/references/schemas/schema-profile-card.md`). Never enter its
mutation flow. Resolve `data/*` against Profile root.
Store law: load the `job-store` skill now; obey it end-to-end.
Refs: `./references/flows/flow-preflight.md`, `./references/flows/flow-search.md`,
`./references/flows/flow-extract.md`, `./references/flows/flow-gate.md`,
`./references/flows/flow-rank.md`, `./references/flows/flow-match-gate.md`.

List only. Never apply, message, or connect.
Write-set: `scout/jobs/*.md` + lock furniture per job-store `contract-persistence.md`.

1. Read `./references/flows/flow-preflight.md`; obey end-to-end.
2. Read `./references/flows/flow-search.md`; obey end-to-end (includes merge). Under `--refresh` skip this step.
3. Read `./references/flows/flow-extract.md`; obey end-to-end.
4. Validate every extract row with `job-store/scripts/validate_extract.py` per `./references/flows/flow-extract.md`; then read `./references/flows/flow-gate.md`; obey end-to-end.
5. Read `./references/flows/flow-rank.md`; obey end-to-end.
6. Persist set from `./references/flows/flow-match-gate.md`. Obey job-store
   schema + persistence. One dossier per persist-set row. No dossier for kit
   drop or uncertain. Existing dead dossier → closure log only. Under
   `--refresh` every row already owns a dossier: a row that leaves the persist
   set leaves its dossier untouched beyond the schema's re-run rules for dead
   and `incompatible`, and Gaps names it.
