---
name: job-apply
description: "Apply to postings from the scout store: find them with job-list, read the dossier and the live ad, resolve or tailor the CV, fill the form from profile Facts, hand back a package for approval, then submit and record after the operator's yes. A posting whose ad is behind a login or account wall is skipped, not cleared. Use when the user runs /job-apply, says apply to this posting, or confirms sent/submitted/applied. The decision to apply is already made; never re-judge the posting. Not for searching (job-scout), scoring a posting (job-match), tailoring a CV alone (job-resume-refine), or reply tracking (job-inbox)."
argument-hint: "[<file> | <url> | --new | --yolo | <auto-detect>]"
---

# Job application

Queues postings from `job-list` and takes them one at a time: reads the ad,
resolves the CV, fills the form from profile Facts, and hands back a package for
approval. A posting whose ad is behind a login or account wall is skipped, not
cleared. It never authors prose: a cover-letter or essay field is the operator's.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every profile path against Profile root (not CWD, not skill dir).
Unreadable Profile root, or a present but unreadable `data/cvs.yaml` → stop and
say so; an absent `data/cvs.yaml` falls back per `flow-apply.md` §3. A dossier
that will not read or parse is one posting's failure, not the run's —
`flow-apply.md` §2.

Write-set: `scout/jobs/` only, and only after a confirmed submission
(`flow-record.md`). A chained `job-resume-refine` writes
`scout/applications/{slug}/` under its own law.

Skill-local files: `./references/*` only.

When the operator message is explicit `sent`, `submitted`, or `applied`
confirmation, read `./references/flow-record.md` now.
Otherwise read `./references/flow-apply.md` now.
Load each additional reference only when that flow names it.

## References

- `./references/flow-apply.md`
- `./references/contract-screening.md`
- `./references/format-package.md`
- `./references/flow-record.md`

## Hard refuses

- Author a cover letter, essay, or any composed free-text answer — staged values
  are file-printed, per `contract-screening.md`
- Click a control that posts before the package review's yes (`--yolo` is that
  yes, given in advance)
- Write `data/`, `cv/`, or — before a confirmed submission — `scout/jobs/`
- Invent, persist, or reuse a secret; passwords, OTP, magic links, and 2FA stop
  once for operator handoff
- Sign in, create an account, or solve a captcha or bot check; a wall in front of
  the ad skips that posting, a wall at submit hands the form back
- Score the posting, rank the fit, or re-judge the decision to apply
