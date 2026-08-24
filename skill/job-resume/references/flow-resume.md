# Job resume — flow

This agent does not submit.

Entered from `job-apply` Prepare → print `Chained from job-apply · {filename}` first.

Writes: `scout/applications/` only.

Load `./references/contract-resume.md` now.

## 1. Posting

Argument = one `scout/jobs/` filename, `{name}.md`, or URL.
Two postings → STOP. No dossier → STOP: `No dossier for {arg}. Run /job-scout.`
Lookup is exact filename or normalized frontmatter `url`
(`job-scout/references/contract-search.md` "URL normalize"). Never company+title.
`status:` must be `new`. Any other → STOP, name
`{status} per scout/jobs/{filename}`. Do not write.
`slug` = filename minus `.md`.
Open the dossier `url`. `## The role` is a pointer; tailor from the live page.
Page dead (extract `dead`: 404 / expired / filled / withdrawn, or the page
prints it is not accepting applications) → STOP; do not tailor from the
dossier snapshot.
Print company, title, and Coverage.

## 2. Profile

Base = `data/cvs.yaml` `default` id. Never pick by `targets`.
Empty `default` → STOP: `No default CV in data/cvs.yaml.`
Source = `cv/resume-{id}.tex` if that file exists; else the `default` row's
`file` stem as `.tex` under `cv/`. Missing `.tex` → STOP:
`No LaTeX base for {id}.` This skill never generates the base.

## 3. Compile

`{title}` is the posting title from step 1.
Empty name in `data/basics.yaml` → STOP: `No name in data/basics.yaml.`
Empty title → STOP: `No title for {filename}.`
`{stem}` = slugify(name) `_` slugify({title}) `_Resume`.
slugify: letters and digits stay; every other run → one `_`; strip edge `_`.
`_Resume` is the tailored-package marker: PASS leaves exactly one
`{dir}/*_Resume.pdf`.
`{dir}` = `scout/applications/{slug}`. `{tex}` = `{stem}.tex`.

`mkdir -p {dir}`; unlink `*.pdf`, `*.tex`, and `match-report.md` in that dir.
Copy the base `.tex` to `{tex}`. Everything through `\begin{document}` is a
byte-for-byte copy — do not add or alter a length, margin, spacing, font-size,
or page-break command there. Rewrite the body under the contract.

`TEXINPUTS` = `kpsewhich` directory for each preamble `\input{...}` not already
in `{dir}` or `cv/`, then `{dir}`, then a trailing `:`.
Compile with
`pdflatex -interaction=nonstopmode -halt-on-error -output-directory={dir} {tex}`.
Then `pdfinfo` and `pdftotext -layout`. Missing binary → STOP, name it.

A TeX error is an environment or macro fault: fix it and recompile. That is
not a Facts fault and does not compact.

Overflow = not one complete page, or `Overfull \vbox` in `{dir}/{stem}.log`.
Overfull `\hbox` is not overflow.

Overflow → compact one unused step, recompile: drop a repeated claim, then an
intensifier no Fact prints, then the weakest bullet against Coverage, then a
`projects.yml` entry, then a whole role. Content only — not layout, type size,
or page breaks. Never compact Skills (contract).

One page and not full (contract) → fill one unused unit, recompile.
A unit is one `skills.yaml` token, one Experience bullet, one `projects.yml`
row, or one role.
Order: unused Skills token (contract order); then the strongest omitted
Coverage bullet; then an omitted `projects.yml` row the ad raises; then an
omitted role that still raises fit. Skip a bullet, project, or role that
does not raise fit. Overflow → revert that unit. Stop when the contract
page is full.

## 4. Verifier

Isolated `spawn_subagent`, read-only. Brief: PROFILE_ROOT, the printed ad,
PDF_TEXT (inline), verbatim `contract-resume.md`, then
`./references/worker-verify.md`. Not the `.tex`. Not this file.

## 5. Outcome

Expect `### Outcome`.

- `pass` → `{stem}.pdf` / `{stem}.tex` stay. Write `match-report.md` from
  **Output**. Print it.
- `fail` → named Facts fixes, no new claims, compile again. Third `fail` →
  write the report with `verdict: **FAIL**` and unlink `{stem}.pdf` /
  `{stem}.tex`.

## Output

```
scout/applications/{slug}/
  match-report.md
  {stem}.tex          # PASS only
  {stem}.pdf          # PASS only
```

`{stem}.pdf` exists iff `match-report.md` prints `verdict: **PASS**`.

Coverage strengths are job-apply Prepare Fit: `direct` = same work and stack;
`adjacent` = name the transferable distance; `none` = keep the row.
ATS tokens = the live ad's required skill names. A hit is a case-insensitive
substring in PDF_TEXT.
`ats` = round(100 × hits / N); `N` = 0 → `ats: n/a` and `miss: _(none)_`.
`fit` counts those rows. Note is one sentence.
`kw` = distinct `skills.yaml` tokens in PDF_TEXT vs the base `.tex` Skills count.

```markdown
# Match report · {company} · {title} · {YYYY-MM-DD}

verdict: **PASS**

## Fit

fit: {n_direct} direct · {n_adjacent} adjacent · {n_none} none
ats: {hits}/{N} · {score} | n/a
kw: {n_printed} tokens · base {n_base}
miss: {token, …} | _(none)_
note: {one sentence}

## Coverage

| requirement   | evidence                                  |
| ------------- | ----------------------------------------- |
| {requirement} | {direct\|adjacent\|none} — {Fact pointer} |

## Outcome

pass → {stem}.pdf written
fail → {reason}; no canonical PDF
```
