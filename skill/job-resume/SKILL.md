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

Resolve every `data/*`, `cv/`, and `scout/` path against Profile root.
Unreadable required Fact file → stop and say so.

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
   Print company, title, and each requirement with Fact evidence
   (`direct` | `adjacent` | `none`).

2. **Profile.** Load `./references/contract-resume.md`. Pick the
   `data/cvs.yaml` `default` id as the base. Never pick by `targets`. Empty
   `default` → STOP: `No default CV in data/cvs.yaml.`
   Source = `cv/resume-{id}.tex` if that file exists; else the `default`
   row's `file` stem → `.tex` under `cv/`. Missing `.tex` → STOP:
   `No LaTeX base for {id}.` This skill never generates the base.

3. **CV.** First write: `mkdir -p scout/applications/{slug}`; unlink
   `resume.pdf` / `resume.tex` if present.
   Copy the entire base `.tex` to `resume.tex`. Rewrite Experience bullets and
   skills from Facts (`experiences.yml`, `skills.yaml`, story frontmatter
   `claim` / `evidence.*` / verified outcome numbers) so the page fits this ad.
   `experiences.yml` `summary` is a pool, not a dump: print only the bullets
   that raise fit for this ad; omit the rest even if true. One page is the
   budget. Do not invent an employer, date, school, number, or client. A
   skill token prints only if it is in `skills.yaml`.
   Identity and role headings that disagree with Facts are corrected from Facts.
   Education stays when `data/education.yaml` is readable and non-empty.
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
   - `pass` → write `resume.pdf` / `resume.tex`. Write `match-report.md` with
     `verdict: **PASS**`. Print it. **STOP**.
   - `fail` → apply the named fixes from Facts, no new claims. Compile again.
     Third `fail` → write `match-report.md` with `verdict: **FAIL**`, unlink
     `resume.pdf` / `resume.tex`, **STOP**.

## Output

```
scout/applications/{slug}/
  match-report.md
  resume.tex          # PASS only
  resume.pdf          # PASS only
```

`resume.pdf` exists iff `match-report.md` prints `verdict: **PASS**`.

```markdown
# Match report · {company} · {title} · {YYYY-MM-DD}

verdict: **PASS**

## Outcome

pass → resume.pdf written
fail → {reason}; no canonical PDF
```
