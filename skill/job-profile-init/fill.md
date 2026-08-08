# Fill (apply questionnaire after emit)

Runs only after emit-tree succeeds and profile Approve is explicit (or on an
already scaffolded target when the operator says "continue fill"). Applies the
in-memory questionnaire buffer; it does not ask new profile questions.
Never invent. Full matrix below. Hard refuses: SKILL.md. Never network-import LinkedIn.

## Source gate

1. Resolve SoT from intake **Source** (paths and/or paste). Compute the same
   **Source key** as intake (sorted absolute path(s), or paste fingerprint).
2. Paths must exist and be readable. Unreadable → STOP; name path; ask again.
3. No path and no paste → continue only when the questionnaire was explicitly
   scaffold-only; otherwise STOP with the same follow-up as intake Source.
4. Chat memory alone is not SoT. Do not fill from "I think you said…".
5. **Reuse vs fresh read:**
   - Source key matches the intake (or prior fill) key **and** a session **SoT
     buffer** exists → reuse that buffer; do **not** re-read path files or re-parse
     PDF text.
   - Source key changed, or no buffer (e.g. **continue-fill** on a scaffolded
     target with no prior Identity ingest) → read each SoT file **once** here
     (PDF/text/md); full-ingest into the buffer; set the Source key.
6. Prefer quoted facts over paraphrase. Hold the buffer for questionnaire
   application; never re-read SoT as a second pass after the buffer is set.
   Missing or unreadable → STOP unless scaffold-only.

## Invent matrix

| Class                                                                      | SoT present                                                                                                       | SoT silent                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Salary, notice, work auth, visa, sponsorship, EOR                          | Propose only verbatim / clear synonym, then require questionnaire confirmation                                    | Ask explicitly; skip leaves empty and may produce a Gap                   |
| Routes (non-EOR), relocation, remote / in-person prefs (`in_person_work*`) | Propose only when SoT prints a clear answer, then require confirmation                                            | Ask explicitly; skip leaves empty; **do not** list under Gaps             |
| Positions, keywords groups, locations                                      | Propose from SoT only; questionnaire confirmation is required                                                     | Ask explicitly; skip → `[]` + Gaps when empty                             |
| Experiences, skills, projects, languages (incl. levels, experience URLs)   | Propose only what is printed, then require row/field confirmation                                                 | Ask explicitly; skip leaves `[]` / empty rows; **do not** list under Gaps |
| CV binary                                                                  | Copy/place user file → `cv/en-us-resume.pdf` when a PDF SoT is given                                              | Report only under **### CV** (not Gaps)                                   |
| Identity (name, email, LI, GH, home_market)                                | Tokens from **Approve** (SoT draft + operator fixes). Questionnaire confirmation required; do not clobber on fill | Ask explicitly; required fields cannot be skipped                         |

Hard: never default sponsorship/visa/EOR to `No` or `Yes` because it is convenient.
EOR bucket needs `employment_routes.employer_of_record: Yes` only when SoT or user says so.

## Apply questionnaire

Use the source buffer when available, but explicit questionnaire values always
win over extracted or template-provided proposals. Apply only confirmed values,
explicit skips, and confirmed pack enablement choices. The source buffer is never
re-read after the Source gate.

- Write all confirmed candidate, basics, collection, and job-search fields.
- Write `seniority_level` as the single confirmed seniority string.
- Write empty values/lists for explicit skips where supported.
- Keep typed defaults only when the questionnaire records explicit `keep`.
- The questionnaire must request observations after every other field and before
  Approve; write that final response to `data/observations.yaml`.
- Do not rewrite identity tokens unless the operator corrects approved values.

## Questionnaire-derived suggestions and packs

Blockers, search suggestions, seniority, and pack enablement
were confirmed before Approve. Apply them here without re-asking.

- Write confirmed positions, keywords, and locations only.
- Write the single confirmed `seniority_level`; do not recreate a boolean
  seniority map.
- Write only confirmed `enabled:` values on named packs. Never edit
  formulations, add a pack, or write a search term the operator did not type.
- A pack whose `[skill:<group>]` group is missing from confirmed
  `job_search.yaml` is named in the fill report; do not rewrite the pack.

## CV

1. If SoT includes a PDF resume/export: copy to `cv/en-us-resume.pdf` by path
   (overwrite only if user confirms when a different PDF already exists). Do not
   re-parse PDF text when the SoT buffer already holds facts.
2. Never generate PDF/LaTeX. Non-PDF SoT → report under **### CV** only (not Gaps).

## Post-fill leak gate

Both must pass before gap report / next-steps:

1. Same `rg '{{'` as emit-tree against target. Any hit → STOP; fix; do not hand off.
2. YAML-parse every `data/*.{yaml,yml}` touched this fill. Any parse error → STOP;
   fix; do not hand off.

## Gap report (required before next-steps)

```text
### Gaps
- <scout-critical only>: missing from SoT | needs operator | blocker skipped
### Filled
- <file>: <one-line what was written>
### Packs
- enabled: <ids or all>
- disabled: <ids or none>
### CV
- placed: yes path | no — operator must add cv/en-us-resume.pdf
### Observations
- saved: yes data/observations.yaml | none
```

Partial fill is OK. **Gaps allowlist only** — omit a line when that key is filled:

- `salary_expectations.salary_range_usd`
- `availability.notice_period`
- `legal_authorization.*`
- `employment_routes.employer_of_record`
- `job_search` `positions` / `keywords.primary` (and `locations` if still empty after
  suggestions)

**Never Gaps:** remote / in-person prefs (`in_person_work*`),
`direct_contractor`, `local_employment`, empty `projects.yml` / `languages.yaml` /
experience `url.*`, or CV (use **### CV**). Apply surfaces empty preference keys at
form time (`job-application` Fact law). Blocker `skip` still emits a Gaps line
**only** when the skipped key is on this allowlist.
