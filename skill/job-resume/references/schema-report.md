# Job resume — package format

Main-only. Never paste into a worker brief.

`job-scout/references/contract-persistence.md` does not apply.

## Layout (under Profile root)

```
scout/applications/{slug}/
  job.md
  match-report.md
  resume.tex          # PASS only
  resume.pdf          # PASS only
  attempts/
    attempt-N.tex
    attempt-N.pdf
    attempt-N.txt
    attempt-N.log
    attempt-N.aux
    attempt-N.out
    attempt-N.work.tex  # CLI debris on crash; main may delete
```

`scout/applications/` is created by this skill, never by `job-profile-init`.
`{slug}` = the dossier filename minus `.md`. Never derive it from company+title.

No other Profile-root path is writable. Never register output in `data/cvs.yaml`.

## Approval invariant

`resume.pdf` exists at the canonical path **iff** `match-report.md` prints
`verdict: **PASS**` and that PDF is a byte copy of `attempts/attempt-N.pdf` for
the attempt the report names. `resume.tex` is the matching `attempt-N.tex`.

`scripts/compile.sh` MUST NOT write `resume.pdf` or `resume.tex`.
Main copies only in Phase 7 after Outcome `pass`.

FAIL → write `job.md`, `match-report.md`, and `attempts/`; unlink `resume.pdf`
and `resume.tex` if present. Never keep a FAIL PDF “for reference”.

## Run-start (dossier `status: new`)

Run-start is the first write, immediately before attempt creation and only
after read-only preflight, posting, and base gates pass.

1. `mkdir -p` `scout/applications/{slug}/attempts`.
2. Unlink `resume.pdf` and `resume.tex` if present.
3. Remove prior `attempts/*`.
4. Attempt numbers start at 1 this run.

## `job.md`

`company`, `title`, and `url` ship double-quoted; escape `"` and `\` as `\"` /
`\\`. Collapse whitespace in a single-line field to one space. `verdict` and
ids stay bare.

```markdown
---
dossier: "2026-08-08-ambar--senior-software-engineer.md"
slug: 2026-08-08-ambar--senior-software-engineer
url: "https://example.com/jobs/123"
company: "Ambar"
title: "Senior Software Engineer"
dossier_status: new
base_id: senior-fullstack
base_tex: cv/resume-senior-fullstack.tex
verdict: pass
attempt: 2
compiled_at: 2026-08-21
---

# Application package · Ambar — Senior Software Engineer

See match-report.md.
```

`verdict` ∈ `pass` | `fail`. `dossier_status` is copied from the dossier at
run-start; this file never mutates the dossier. `url` is the dossier
frontmatter URL, normalized per `job-scout/references/contract-search.md`
“URL normalize”.

## `match-report.md`

```markdown
# Match report · {company} · {title} · {YYYY-MM-DD}

verdict: **PASS**

base: {id} · {one clause: why targets fit ### Ad+Fit, or default-on-tie}
pages: {N from compile.sh stdout} · compiles: {k}/6
attempt: {N}

## Fit coverage

| requirement | on page | strength | source |

## Numbers

| printed | source | kind |
kind ∈ outcome | years-of-X

## Omissions

- {role or bullet} · {reason} · date gap: yes|no

## Forbidden

_(none)_

## Attempts

| N | pages | CLI | note |

## Outcome

pass → resume.pdf written from attempt-{N}
fail → {reason}; no canonical PDF
```

`verdict:` line is exactly `verdict: **PASS**` or `verdict: **FAIL**`.
`pages:` is the CLI `Pages: N` for the named attempt — never a counted or
vision-estimated value. FAIL `reason` ∈ `reject` | `geometry exhausted` |
`rewrite exhausted` | `compile ceiling` | `pdflatex` | `{named STOP}`.

Every omission that opens a date gap is a row with `date gap: yes`.
`## Forbidden` lists every `never_say` or checker-reject hit, or `_(none)_`.

## Attempts

One `attempt-N.tex` per compile. `compile.sh` writes the sibling `.pdf` /
`.txt` / `.log` / `.aux` / `.out` into `attempts/` only.

## Re-run

| Condition                         | Do                                                                 |
| --------------------------------- | ------------------------------------------------------------------ |
| dossier `status: new`             | Run-start, then this run owns the directory                        |
| any other dossier `status:`       | STOP — do not write                                                |
| FAIL after a prior PASS this slug | Invariant: canonical PDF/tex unlinked at run-start; stay unlinked  |
| crash mid-run                     | Canonical PDF/tex already unlinked; leftover attempts are this run |
