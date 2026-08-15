# Job scout — report format

The output contract for `pipeline.md` Phase 5. Main-only, same as that file.
Never paste either into a worker brief.

## Report format

Emit markdown **exactly** in this section order, then hand back to `pipeline.md`
Phase 6 — the dossiers are written after this report, and the **STOP** belongs at
the end of that phase, not here.
Every section below is the **chat deliverable only**. Disk receives dossiers under
`scout/jobs/` per `dossier.md` — never a run file, never a second copy of ranked
tables or score factors. No preamble. No apply / message / connect / open-form language.

### Header

`# Job Scout · {YYYY-MM-DD} · {n} live≥7 · {n} contacts · {n} defects`

- `live≥7` — `status=live` and score ≥7
- `contacts` — public email or @handle across gated search rows. Named `contacts`,
  not `email`: an @handle is not an email address, and counting both under `email`
  claims addresses the run never found
- `defects` — pack verdicts `defect: {name}` **and** `auth_gate`, which
  `pipeline.md` counts as a pack defect
- Never invent a run filename. Never print a write-success count.

### Do this first

Exactly 3 if ≥3 **eligible** rows; fewer if not, including none. Eligible = live,
score≥7, bucket ≠ `unbucketed`. Count the trigger on that same population — counting
it on all live≥7 rows would promise three picks this section is not allowed to list.
Prefer direct over EU/US-only on ties.
`unbucketed` rows are not eligible here or in the table — they list under Gaps only
(`pipeline.md` `## Bucket`), because the posting printed no route to judge them by.
The header's `live≥7` census stays unfiltered: every live row has a dossier, so the
remainder line must point at the whole store.

1. **{company}** — {title} — score **{score}** — {bucket_short}
   {why ≤ 20 words} / {contact if printed} / {url}

### Ranked

`status=live` AND `score≥8`, excluding `unbucketed`. Sort per `pipeline.md`
`## Channel sort`.
Rows already named in Do this first repeat here — the two sections answer different
questions, and a table that hid its own top rows would read as if they were missing.

| score | company | title | bucket | contact | why | url |
| ----: | ------- | ----- | ------ | ------- | --- | --- |

- `bucket` = `bucket_short`
- `contact` = public email or @handle, else `—`
- `why` ≤12 words; `EU/US-only` → printed geo/auth blocker only
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

- skipped: {source} ({reason})
- tool defects: {tool} ({reason})
- uncertain: {url or company} ({reason}) # only if any
- unbucketed: {company} — {title} (no printed work_auth, hiring_route, or location)

`skipped` also covers dry packs (`{pack_id} (dry)`). `tool defects` also covers
pack verdicts `defect: {name}` and `auth_gate`. Omit recovered fetches, location-gate drops,
disabled packs, never-live dead, and score<7 rows.

## Inclusion / hard rules (spec-only; never emitted)

- Do this first: `status=live` AND `score≥7` AND bucket ≠ `unbucketed`
- Ranked table: `status=live` AND `score≥8` AND bucket ≠ `unbucketed`
- Unknown = `—` (never invent)
- Empty section → omit (never `_(none)_`)
- why ≤12 words in the table; ≤20 in Do this first

## Controlled vocab (spec-only; never emitted)

- `bucket_short`: `direct` | `EOR` | `EU/US-only` | `unbucketed`
  (derivation table in `pipeline.md`, under `## Bucket`)
- `channel`: `direct_email` | `dm_request` | `founder` | `ats`
- `verdict`: `pass`, `skipped: disabled`, `auth_gate`, or `defect: {name}`
  (`auth_gate` and `defect: {name}` both count as defects — header and Gaps)
