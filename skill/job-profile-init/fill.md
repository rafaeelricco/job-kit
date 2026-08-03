# Fill (after emit)

Runs only on the intake target after emit-tree succeeds (or on an already
scaffolded empty target when the operator says "continue fill" with SoT).
Never invent. Never network-import LinkedIn.

## Source gate

1. Resolve SoT from intake **Source** (paths and/or paste buffer this turn).
2. Paths must exist and be readable. Unreadable → STOP; name path; ask again.
3. No path and no paste → STOP; same follow-up as intake Source.
4. Chat memory alone is not SoT. Do not fill from "I think you said…".
5. Read all SoT files (PDF/text/md). Prefer quoted facts over paraphrase.

## Invent matrix

| Class                                                                 | SoT present                                                                                                                   | SoT silent                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Salary, notice, work auth, visa, sponsorship, EOR, routes, relocation | Map verbatim / clear synonym into `data/candidate.yaml`                                                                       | Leave empty; list under Gaps                             |
| Positions, keywords groups, locations, blacklists                     | Extract; **suggestions** only if labeled as such and user confirms before write                                               | Suggest from SoT stack only; never write without confirm |
| Experiences, skills, projects, languages                              | Extract only what is printed                                                                                                  | Leave `[]` / empty rows; Gaps                            |
| Search pack places                                                    | N/A                                                                                                                           | Catalog multi_select (below)                             |
| CV binary                                                             | Copy/place user file → `cv/en-us-resume.pdf` when a PDF SoT is given                                                          | Gaps: operator places PDF                                |
| Identity (name, email, LI, GH, home_market)                           | Tokens from **Approve** (SoT draft + operator fixes). Do not clobber on fill. Operator re-correct → rewrite those tokens only | Approve-only (scaffold had no SoT)                       |

Hard: never default sponsorship/visa/EOR to `No` or `Yes` because it is convenient.
EOR bucket needs `employment_routes.employer_of_record: Yes` only when SoT or user says so.

## Write order (overwrite Fact files only)

1. `data/candidate.yaml` — salary_range_usd, notice_period, legal_authorization*,
   employment_routes*, open_to_relocation / remote prefs when evidenced.
2. `data/job_search.yaml` — positions, keywords.*, locations, blacklists
   (defaults for work_model / levels / job_types stay unless SoT contradicts).
3. `data/experiences.yml` — one object per role; keys per template comment.
4. `data/skills.yaml` + `data/skills-by-company.yml` when SoT maps company→skills.
5. `data/projects.yml` — public portfolio only.
6. `data/languages.yaml` — only levels printed in SoT.
7. Optional: `data/basics.yaml` headline / phone / location if SoT prints them.
8. Do not rewrite identity tokens unless the operator corrects approved values.

## Suggestions (positions / keywords / blacklists)

1. Print `### Suggestions` with labeled lists derived only from SoT
   (titles, stack terms, junior/intern title filters already in template).
2. Wait for confirm or edits. No silent write of suggestions.
3. Then write `job_search.yaml`.

## Pack confirm

1. Print catalog of **places** = template packs in `data/search_packs.yaml`
   (id + one-line surface/entry) after emit (still full template list).
2. Ask: **all** (default) or **specific pack ids**.
3. Write `data/search_packs.yaml` keeping only selected packs; keep
   `max_parallel` / `extract_batch_size`.
4. Rewrite each remaining pack's `formulations` (≥3) using confirmed
   `[role]` / `[skill:<group>]` tokens from filled `job_search.yaml`.
   Keep `impl` stems as `surface-*`, matching job-scout reference basenames.
5. Keep full `data/sources.yaml` so tier-entry packs still resolve.
6. Warn once: every pack left in the file runs on every job-scout session.

## CV

1. If SoT includes a PDF resume/export: copy to `cv/en-us-resume.pdf`
   (overwrite only if user confirms when a different PDF already exists).
2. Never generate PDF/LaTeX. Non-PDF SoT → Gaps line for operator PDF.

## Post-fill leak gate

Same `rg` as emit-tree against target. Any hit → STOP; fix; do not hand off.

## Gap report (required before next-steps)

```text
### Gaps
- <field or file>: missing from SoT | needs operator
### Filled
- <file>: <one-line what was written>
### Packs
- selected: <ids or all>
### CV
- placed: yes path | no — operator must add cv/en-us-resume.pdf
```

Partial fill is OK. Scout needs non-TODO `positions` + real `keywords.primary`
and candidate salary/auth when available; Gaps must name what still blocks a useful scout.
