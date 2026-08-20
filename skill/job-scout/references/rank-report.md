# Job scout — rank and report

The output and ranking contract for `flow-scout.md` Phase 5. Main-only, same as
that file. Never paste into a worker brief.

## Score (0–9; keep ≥ 7)

Candidate skill set `C` is the deduplicated union of:

- `data/skills.yaml` `skills[].items`
- `data/job_search.yaml` `keywords.primary`

Required skill set `R` is extract `required_skills`.
Normalize both by trimming, case-folding, collapsing whitespace, and
stripping separator punctuation (commas, slashes, parentheses). Keep
identifier punctuation (`+`, `#`, `.`) so `C++`, `C#`, and `Node.js`
stay distinct. Match normalized values exactly; never infer aliases.

If `R` is absent/`—`, or `C` is empty, the row is unscored (`score: —`) and
lists under Gaps.

`skills = floor(cap × |R ∩ C| / |R|)` where `cap=7`, or `cap=5` when geo/auth
participates.

Seniority:

- exact configured level = 2
- adjacent level in `entry < mid-level < senior < director` = 1
- explicit mismatch = 0
- unknown = `—` and is not added

Geo/auth participates only for enabled onsite/hybrid models:

- 0: printed constraint conflicts with a confirmed profile fact
- 2: both `work_auth` and `hiring_route` are printed and confirmed compatible
- 1: exactly one is printed and confirmed compatible
- `—`: insufficient printed/profile evidence

If skills is numeric, total is the sum of numeric factors; `—` factors are not
added. If skills is `—`, total is `—`. Do not score recency; `date_posted` already
dropped out-of-window rows at search. Print factors only on dossier `## Verdict`,
never in the chat Score audit.

## Bucket (main-derived; never a gated column)

Derived from extract output. NEVER set by a worker. First eligible match wins.

1. Printed EOR/Deel/Oyster/hire-from-anywhere route and
   `employment_routes.employer_of_record == Yes` → `EOR`
2. Contractor/B2B or LATAM/global/anywhere/worldwide → `direct`
3. Printed jurisdiction/work-auth or country/region restriction → `restricted-geo`,
   blocker = printed restriction
4. Printed EOR/Deel/Oyster/hire-from-anywhere route with any other profile value
   → `unbucketed`; blocker `EOR route not enabled in profile`
5. Otherwise → `unbucketed`

`unbucketed` enters no ranked table or Do this first — it still gets a dossier and
counts in the header census. List under Gaps. Never guess a route from a company's
country. `direct` and `EOR` name the hire-from route the JD prints, not its location.

## Channel sort (report tables)

`direct_email` → `dm_request` → `founder` → `ats`, then score desc.

## Report format

Emit markdown **exactly** in this section order, then hand back to `flow-scout.md`
Phase 6 — the dossiers are written after this report, and the **STOP** belongs at
the end of that phase, not here.
Every section below is the **chat deliverable only**. Disk receives dossiers under
`schema-dossier.md` — never a run file, never a second copy of ranked tables or
score factors. No preamble. No apply / message / connect / open-form language.

### Header

`# Job Scout · {YYYY-MM-DD} · {n} live≥7 · {n} contacts · {n} defects`

- `live≥7` — `status=live` and score ≥7
- `contacts` — public email or @handle across gated search rows. Named `contacts`,
  not `email`: an @handle is not an email address, and counting both under `email`
  claims addresses the run never found
- `defects` — pack verdicts `defect: {name}` **and** `auth_gate`, which
  `flow-scout.md` counts as a pack defect
- Never invent a run filename. Never print a write-success count.

### Do this first

Exactly 3 if ≥3 **eligible** rows; fewer if not, including none. Eligible = live,
score≥7, bucket ≠ `unbucketed`. Count the trigger on that same population — counting
it on all live≥7 rows would promise three picks this section is not allowed to list.
Prefer direct over restricted-geo on ties.
`unbucketed` rows are not eligible here or in the table — they list under Gaps only,
because the posting printed no route to judge them by. The header's `live≥7` census
stays unfiltered: every live row has a dossier, so the remainder line must point at
the whole store.

1. **{company}** — {title} — score **{score}** — {bucket_short}
   {why ≤ 20 words} / {contact if printed} / {url}

### Ranked

`status=live` AND `score≥8`, excluding `unbucketed`. Sort per `## Channel sort`.
Rows already named in Do this first repeat here — the two sections answer different
questions, and a table that hid its own top rows would read as if they were missing.

| score | company | title | bucket | contact | why | url |
| ----: | ------- | ----- | ------ | ------- | --- | --- |

- `bucket` = `bucket_short`
- `contact` = public email or @handle, else `—`
- `why` ≤12 words; `restricted-geo` → printed geo/auth blocker only
- Unknown = `—`
- Zero ≥8 eligible rows → omit this heading and the table; the remainder line below
  still prints

**Remainder line** — a bare line, not a section heading. Emit it last, after whatever
sections printed, when `live≥7` exceeds the rows already printed above (Do this first
∪ table, counted once):

- Rows printed above → `+{n} more live≥7 → {abs Profile root}/scout/jobs/`
- Nothing printed above, because every live≥7 row was `unbucketed` →
  `{n} live≥7 → {abs Profile root}/scout/jobs/`. Never `+{n} more` there: there is no
  "more" when the reader was shown nothing to add to.

### Gaps

Omit this heading when the list is empty.

- skipped: {pack_id} ({reason})
- tool defects: {tool} ({reason})
- uncertain: {url or company} ({reason}) # only if any
- unscored: {company} — {title} (required skills not printed or profile skills empty)
- route disabled: {company} — {title} (EOR not enabled in profile)
- unbucketed: {company} — {title} (no printed route or restriction)

`skipped` covers dry packs (`{pack_id} (dry)`). `tool defects` also covers pack
verdicts `defect: {name}` and `auth_gate`. Omit recovered fetches, location-gate
drops, disabled packs, never-live dead, and score<7 rows unless they are unscored.
