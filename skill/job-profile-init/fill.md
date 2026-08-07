# Fill (after emit)

Runs only on the intake target after emit-tree succeeds (or on an already
scaffolded empty target when the operator says "continue fill" with SoT).
Never invent. Full matrix below. Hard refuses: SKILL.md. Never network-import LinkedIn.

## Source gate

1. Resolve SoT from intake **Source** (paths and/or paste). Compute the same
   **Source key** as intake (sorted absolute path(s), or paste fingerprint).
2. Paths must exist and be readable. Unreadable → STOP; name path; ask again.
3. No path and no paste → STOP; same follow-up as intake Source.
4. Chat memory alone is not SoT. Do not fill from "I think you said…".
5. **Reuse vs fresh read:**
   - Source key matches the intake (or prior fill) key **and** a session **SoT
     buffer** exists → reuse that buffer; do **not** re-read path files or re-parse
     PDF text.
   - Source key changed, or no buffer (e.g. **continue-fill** on a scaffolded
     target with no prior Identity ingest) → read each SoT file **once** here
     (PDF/text/md); full-ingest into the buffer; set the Source key.
6. Prefer quoted facts over paraphrase. Hold the buffer for Fact fan-out; never
   re-read SoT as a second pass after the buffer is set. Missing or unreadable →
   STOP (unless scaffold-only, which skips fill entirely).

## Invent matrix

| Class                                                                                                          | SoT present                                                                                                                   | SoT silent                                                 |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Salary, notice, work auth, visa, sponsorship, EOR                                                              | Map verbatim / clear synonym into `data/candidate.yaml`                                                                       | Leave empty; list under Gaps                               |
| Routes (non-EOR), relocation, remote / in-person prefs, screening binaries (`willing_to_*`, `in_person_work*`) | Map only when SoT prints a clear answer                                                                                       | Leave empty; **do not** list under Gaps                    |
| Positions, keywords groups, locations, blacklists                                                              | **Suggestions stage only**; confirm before write; never write in Fact fan-out                                                 | Suggest from SoT stack only; skip → `[]` + Gaps when empty |
| Experiences, skills, projects, languages (incl. levels, experience URLs)                                       | Extract only what is printed                                                                                                  | Leave `[]` / empty rows; **do not** list under Gaps        |
| CV binary                                                                                                      | Copy/place user file → `cv/en-us-resume.pdf` when a PDF SoT is given                                                          | Report only under **### CV** (not Gaps)                    |
| Identity (name, email, LI, GH, home_market)                                                                    | Tokens from **Approve** (SoT draft + operator fixes). Do not clobber on fill. Operator re-correct → rewrite those tokens only | Approve-only (scaffold had no SoT)                         |

Hard: never default sponsorship/visa/EOR to `No` or `Yes` because it is convenient.
EOR bucket needs `employment_routes.employer_of_record: Yes` only when SoT or user says so.

## Fact fan-out

Order free after Source gate (one buffer; reuse or one fresh read); invent matrix binds.
**Not in this step:** `job_search` positions / keywords / locations / blacklists —
sole writer is Suggestions; `data/search_packs.yaml` — sole writer is Packs;
`work_model` / `levels` / `job_types` only when SoT contradicts defaults.

- `data/candidate.yaml` — salary_range_usd, notice_period, legal_authorization*,
  `employment_routes.employer_of_record` when evidenced; other routes / relocation /
  remote prefs / screening binaries only when SoT prints them (never invent, never force).
- `data/experiences.yml` — one object per role; keys per template comment.
- `data/skills.yaml` + `data/skills-by-company.yml` when SoT maps company→skills.
- `data/projects.yml` — public portfolio only.
- `data/languages.yaml` — only levels printed in SoT.
- Optional: `data/basics.yaml` phone / location / url.href if SoT prints them.
- Do not rewrite identity tokens unless the operator corrects approved values.

## Blocker fill (after Fact fan-out, before Suggestions)

**One message.** Ask only the blockers the Fact fan-out left empty — never re-ask a
field the fill just wrote from SoT. The table below is the whole set: it does not
grow per session and it does not shrink because the turn is long.

| #   | Key path                                                   | Ask                                   |
| --- | ---------------------------------------------------------- | ------------------------------------- |
| 1   | `salary_expectations.salary_range_usd`                     | target band in USD                    |
| 2   | `availability.notice_period`                               | notice owed to current employer       |
| 3   | `legal_authorization.*` for the `home_market` jurisdiction | one grouped question, not 16 fields   |
| 4   | `employment_routes.employer_of_record`                     | Yes / No — gates the EOR scout bucket |

- **`skip` is a first-class answer.** It writes nothing and emits a Gaps line. Offer
  it explicitly on every item.
- Silence is not an answer and is not a skip. Re-ask once, then record as skipped.
- No defaults, no inference, no "most candidates say two weeks". Never default
  sponsorship / EOR / a salary band because the turn is nearly over. The invent
  matrix above applies unchanged.
- Answers write only the listed key paths. Never touch identity tokens.
- Never resolve a blocker by looking anything up online. Hard refuse.
- **Scaffold-only never runs this stage** — no SoT, no fill.

## Suggestions (positions / keywords / blacklists)

1. Print `### Suggestions` with labeled lists derived only from SoT
   (titles, stack terms, junior/intern title filters already in template).
2. Wait for confirm or edits. No silent write of suggestions.
3. After confirm, write `data/job_search.yaml` positions / keywords / locations /
   blacklists from confirmed values only. `work_model` / `levels` / `job_types`
   stay template defaults unless Fact fan-out already wrote them from SoT.
4. Skip → write empty arrays `[]`, clearing placeholders (`Software Engineer`,
   `TODO-skill`, `Remote`). Gaps allowlist still lists empties.

## Packs (after Suggestions confirm)

1. Print `### Packs` — one line per pack in the emitted `data/search_packs.yaml`:
   `id · surface · tokens it needs`. Ask which to disable.
2. Wait for confirm. Skip or silence → leave every pack `enabled: true`; that is a
   valid deck, not a gap.
3. On confirm, write only `enabled:` on the named packs. Never edit `formulations`,
   never add a pack, never write a search term the operator did not type — a pack
   needing a keyword group that does not exist is disabled, not rewritten.
4. A pack whose `[skill:<group>]` group is missing from the confirmed
   `job_search.yaml` → name it in the same message; the operator decides.

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
```

Partial fill is OK. **Gaps allowlist only** — omit a line when that key is filled:

- `salary_expectations.salary_range_usd`
- `availability.notice_period`
- `legal_authorization.*`
- `employment_routes.employer_of_record`
- `job_search` `positions` / `keywords.primary` (and `locations` if still empty after
  suggestions)

**Never Gaps:** screening binaries (`willing_to_*`, `in_person_work*`),
`direct_contractor`, `local_employment`, empty `projects.yml` / `languages.yaml` /
experience `url.*`, or CV (use **### CV**). Apply surfaces empty screening keys at
form time (`job-application` Fact law). Blocker `skip` still emits a Gaps line
**only** when the skipped key is on this allowlist.
