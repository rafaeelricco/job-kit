---
name: job-prep
description: "Prepare application packages offline for hot dossiers: revalidate the live ad, read the form's fields, resolve each against profile Facts, chain job-resume-refine, and write plan.json plus package.md for later approval; --digest lists plans ready to send. Use when the user runs /job-prep, a nightly prep cron fires, or a morning digest cron asks what is prepared. Not for submitting (job-apply), scoring (job-match), searching (job-scout), or listing dossiers (job-list)."
argument-hint: "[--top N | --channel ats|dm_request|direct_email | --digest | <file>...]"
---

# Job prep

Prepares, never posts. `job-apply/references/flow-apply.md` §§2–4 run here;
§5 does not exist in this skill. `--digest` is read-only and opens no browser.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every profile path against Profile root (not CWD, not skill dir).

Write-set: `scout/applications/{slug}/` — `plan.json`, `package.md`, and the
chained `job-resume-refine`'s own outputs — plus one `posting dead` log line on
a `scout/jobs/` dossier whose ad reads dead (`flow-prep.md` §2). Never
`status:`, never the scout-owned body. `data/` and `cv/` are read-only; the
dossier stays `status: new` until `job-apply/references/flow-record.md` runs.

Skill-local files: `./references/*` only.

Read `./references/flow-prep.md` now.

## References

- `./references/flow-prep.md`
- `./references/schema-plan.md`
- `./references/ats-greenhouse.md`
- `./references/ats-lever.md`
- `./references/ats-ashby.md`

## Hard refuses

- Click any control that posts, saves, or creates an account — "Save draft" and
  "Continue" past the last read-only step included
- Write `data/` or `cv/`; write `scout/jobs/` beyond the one `posting dead` log
  line §2 appends — never `status:`, never the body
- Author a cover letter, message, essay, or composed free-text answer
- Emit a plan for a posting whose ad did not read this run
- Sign in, create an account, or solve a captcha or bot check; a wall on the
  apply path is a `needs_you` row, never cleared
