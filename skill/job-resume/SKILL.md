---
name: job-resume
description: "Use when the user runs /job-resume, asks for a tailored résumé or CV PDF against one scout dossier, a one-page LaTeX resume for a posting, or a match-report; also when job-apply Prepare spawns this skill for a status:new dossier. Not for submitting an application (job-apply), ranking openings (job-scout), or editing Fact YAML (job-profile-me)."
---

# Job resume

One posting. One page. Facts only.

May be entered from `job-apply` Prepare as an isolated `spawn_subagent`
(Argument: `{filename}`, `PROFILE_ROOT`). This agent is still resume main:
it compiles and may spawn the verifier. It never submits. PASS and FAIL still
**STOP** this agent.

Profile root: load the `job-profile-root` skill now.
Load `./references/contract-resume.md`.

Resolve every `data/*`, `cv/`, and `scout/` path against Profile root.

Skill-local files: `./references/contract-resume.md` and
`./references/worker-verify.md` only.

Writes only `scout/applications/`. Never `data/`, `cv/`, `scout/jobs/`.

Entered from `job-apply` Prepare → print `Chained from job-apply · {filename}`
first.

## Flow

1. **Posting.** Argument = one `scout/jobs/` filename, `{name}.md`, or URL.
   Two postings → STOP. No dossier → STOP: `No dossier for {arg}. Run /job-scout.`
   Lookup is exact filename or normalized frontmatter `url`. Never company+title.
   `status:` must be `new`. Any other → STOP, name
   `{status} per scout/jobs/{filename}`. Do not write.
   `slug` = filename minus `.md`.
   Open the dossier `url`. `jd_excerpt` is a pointer, never the JD. Page dead →
   STOP; do not tailor from the excerpt.
   Print company, title, and the Coverage table in **Output**.

2. **Profile.** Pick the `data/cvs.yaml` `default` id as the base. Never pick
   by `targets`. Empty `default` → STOP: `No default CV in data/cvs.yaml.`
   Source = `cv/resume-{id}.tex` if that file exists; else the `default`
   row's `file` stem → `.tex` under `cv/`. Missing `.tex` → STOP:
   `No LaTeX base for {id}.` This skill never generates the base.

3. **CV.** `{stem}` = slugify(`data/basics.yaml` `name`) `_` slugify({title}) `_Curriculo`.
   `{title}` is the posting title printed in step 1. slugify: keep letters and
   digits; every other run → one `_`; strip edge `_`. Empty name → STOP:
   `No name in data/basics.yaml.` Empty title → STOP: `No title for {filename}.`
   First write: `mkdir -p scout/applications/{slug}`; unlink `*.pdf` and
   `*.tex` in that dir if present.
   Copy the entire base `.tex` to `{stem}.tex`. Rewrite under the contract.
   `{dir}` = `scout/applications/{slug}`. `{tex}` = `{stem}.tex`.
   Compile with `pdflatex -interaction=nonstopmode -halt-on-error
-output-directory={dir} {tex}`. Set `TEXINPUTS` to the directory of
   `kpsewhich glyphtounicode.tex` plus the `.tex` dir (bases
   `\input{glyphtounicode}`; `cv/` does not ship it). Then `pdfinfo` and
   `pdftotext -layout`. Missing binary → STOP, name it.
   Not one page, or `pdflatex` fail → treat as verifier `fail` and adjust.

4. **Verifier.** Isolated `spawn_subagent`, read-only. Brief is **only**
   PROFILE_ROOT, the printed ad, PDF_TEXT (inline, not a path), verbatim
   `contract-resume.md`, then `./references/worker-verify.md` deltas.
   Never the `.tex`. Never this file.

5. **Pass or adjust.** Expect `### Outcome`.
   - `pass` → write `{stem}.pdf` / `{stem}.tex`. Write `match-report.md` from
     **Output**. Print it. **STOP**.
   - `fail` → apply the named fixes from Facts, no new claims. Compile again.
     Third `fail` → write `match-report.md` from **Output** with
     `verdict: **FAIL**`, unlink `{stem}.pdf` / `{stem}.tex`, **STOP**.

## Output

```
scout/applications/{slug}/
  match-report.md
  {stem}.tex          # PASS only
  {stem}.pdf          # PASS only
```

`{stem}.pdf` exists iff `match-report.md` prints `verdict: **PASS**`.

Coverage rows = the ad's requirements with Fact evidence
(`direct` | `adjacent` | `none`). ATS tokens = the live ad's required skill
names (not nice-to-haves). A hit is a case-insensitive substring in PDF_TEXT.
`ats` score = round(100 × hits / N). `fit` counts those rows. Note is one
sentence.

```markdown
# Match report · {company} · {title} · {YYYY-MM-DD}

verdict: **PASS**

## Fit

fit: {n_direct} direct · {n_adjacent} adjacent · {n_none} none
ats: {hits}/{N} · {score}
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
