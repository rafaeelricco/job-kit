---
name: job-apply
description: "Apply to postings from the scout store with no operator in the loop: read the dossier and the live ad, resolve or tailor the CV, fill the form from profile Facts, derived and default answers, author any prose field, clear captchas, sign-ins, and mail codes, then submit and record. Use when the user runs /job-apply, says apply to this posting, or confirms sent/submitted/applied. Not for deciding whether to apply or scoring a posting (job-match), searching (job-scout), tailoring a CV alone (job-resume-refine), or reply tracking (job-inbox)."
argument-hint: "[<file> | <url> | --new | --yolo | --cv-sha256 <hex> | --prepared-at <iso-Z> | <auto-detect>]"
---

# Job application

Queues postings from `job-list` and takes them one at a time: reads the ad,
resolves the CV, fills the form by the resolution order in
`contract-screening.md`, authors prose fields under `contract-prose.md`,
clears walls, submits, and records. It never waits for the operator: a
blocker no rule clears skips that posting.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Store law: load the `job-store` skill now; obey it end-to-end.

Resolve every profile path against Profile root (not CWD, not skill dir).
Unreadable Profile root, or a present but unreadable `data/cvs.yaml` → stop and
say so; an absent `data/cvs.yaml` falls back per `flow-apply.md` §3. A dossier
that will not read or parse is one posting's failure, not the run's —
`flow-apply.md` §2.

Write-set: `scout/jobs/` only — a confirmed submission (`flow-record.md`), or
one `posting dead` log line when the ad reads dead (`flow-apply.md` §2). A
chained `job-resume-refine` writes `scout/applications/{slug}/` under its own
law. `scout/applications/{slug}/plan.json` is read-only input here
(`flow-apply.md` §3 rule 0); only `job-prep` writes it.

Skill-local files: `./references/**` only.

When the operator message is explicit `sent`, `submitted`, or `applied`
confirmation, read `./references/flows/flow-record.md` now.
Otherwise read `./references/flows/flow-apply.md` now.
Load each additional reference only when that flow names it.

## References

- `./references/flows/flow-apply.md`
- `./references/contracts/contract-screening.md`
- `./references/contracts/contract-prose.md`
- `./references/formats/format-package.md`
- `./references/flows/flow-record.md`

## Hard refuses

- State a fact no Fact file or the live ad prints, in a form value, a letter,
  or an answer; a missing part is named as not on record, never estimated
- Read a story body, or ship a `never_say` claim or a process number
- Write `data/`, `cv/`, or — before a confirmed submission — `scout/jobs/`,
  except the one `posting dead` log line `flow-apply.md` §2 appends
- Type, invent, persist, or reuse a password; create a password account; sign
  in as any identity but `data/basics.yaml` `email`
- Stage protected-class data: demographic and EEO questions are declined,
  never answered from a file or memory
- Wait for the operator: a wall, refusal, or empty required field
  `flow-apply.md` cannot clear skips the posting under `### Skipped`
- Score the posting, rank the fit, or re-judge the decision to apply
