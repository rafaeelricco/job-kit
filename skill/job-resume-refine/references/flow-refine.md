# Job resume refine — flow

Chained from job-apply Prepare → print `Chained from job-apply · {filename}` first.

Load `./references/contract-refine.md` now.

## 1. Posting

Argument is one `scout/jobs/` filename or a URL. Lookup is exact filename or
normalized frontmatter `url` — obey `job-scout/references/schema-dossier.md`
"URL normalize". Never company+title: one company posts many roles.

Two arguments, no dossier, or `status:` other than `new` → say which and stop
without writing.

`{slug}` = filename minus `.md`.

Open the dossier `url` and tailor from the live page — `## The role` is a
snapshot that may have gone stale. Page dead (404, expired, filled, withdrawn,
or it prints that it is not accepting applications) → stop.

Print company, title, and the ad's required skills.

## 2. Base

`data/cvs.yaml` `adapt_per_vacancy: false` → stop and say refinement is off;
job-apply attaches the base unchanged.

Base PDF is `cvs.yaml` `base` under `cv/`; the source is the same stem with
`.tex`. Missing `.tex` → stop and name the path. This skill never authors a base.

Report the base's page count, and whether the `.pdf` is older than its `.tex`.
Both are the operator's to fix per `cv/README.md` — neither stops this run,
since the tailored PDF compiles from the `.tex`.

## 3. Compile

`{stem}` = slugify(`basics.yaml` name) `_` slugify(title) `_Resume`.
slugify: letters and digits stay, every other run becomes one `_`, edges stripped.
`_Resume` is the tailored-package marker — a PASS leaves exactly one
`{dir}/*_Resume.pdf`, which is what job-apply globs for.
`{dir}` = `scout/applications/{slug}`.

`mkdir -p {dir}`; unlink `*.pdf`, `*.tex`, and `match-report.md` there.
Copy the base `.tex` to `{dir}/{stem}.tex`, then apply the contract's four
allowed edits. Recomposing the Summary needs `./format-summary.md`.

Load the `job-humanize` skill and obey it end-to-end on the Summary block
only (sentences 1 and 3; sentence 2 stays verbatim). Brief: `Surface: summary`,
verbatim `contract-refine.md` as `CONTRACT`, Summary prose as `DRAFT`. Write
the returned text into the `.tex`. If the skill does not resolve, stop and
name it. Never pass bullets, Skills tokens, or the preamble.

`TEXINPUTS` = the `kpsewhich` directory for each preamble `\input{...}` not
already in `{dir}` or `cv/`, then `{dir}`, then a trailing `:`.
Compile with
`pdflatex -interaction=nonstopmode -halt-on-error -output-directory={dir} {tex}`,
then `pdfinfo` and `pdftotext -layout`. Missing binary → stop and name it.

A TeX error is a macro or environment fault: fix and recompile. An error inside
the copied preamble → stop with the log excerpt; the base preamble is not yours.

Run the contract's checks. Fit the page per the contract, recompiling each time.

Unlink `{dir}/*.aux`, `*.log`, `*.out` once the checks pass — the package is the
`.tex`, the `.pdf`, and the report.

## 4. Report

Write `{dir}/match-report.md` and print it. `verdict: **PASS**` is what
job-apply gates on, so the PDF exists exactly when the report says PASS. A check
that cannot be satisfied → write the report with `verdict: **FAIL**` and unlink
`{stem}.pdf` / `{stem}.tex`.

    # Refine · {company} · {title} · {YYYY-MM-DD}

    verdict: **PASS**

    bullets: {kept} of {pool} · roles: {n}, all present
    summary: recomposed | base block kept | base has none
    skills: {count} tokens ({in} in, {out} out) · ad tokens: {hit}/{total}
    page: 1 · {pct}% trailing · base: {n}p{, pdf stale}
    miss: {ad token, …} | _(none)_

    ## Dropped

    | role | bullet | why |
    | ---- | ------ | --- |
    | {company} | {first ~50 chars}… | {discipline the ad never raises} |

## Output

    scout/applications/{slug}/
      match-report.md
      {stem}.tex          # PASS only
      {stem}.pdf          # PASS only
