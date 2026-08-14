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

`# Job Scout · {YYYY-MM-DD} · {n} live≥7 · {n} email · {n} defects`

- `live≥7` — `status=live` and score ≥7
- `email` — public email or @handle across gated search rows
- `defects` — pack verdicts `defect: {name}`
- Never invent a run filename. Never print a write-success count.

### Do this first

Exactly 3 if ≥3 live score≥7 rows; fewer if not. Prefer direct over EU/US-only on ties.
`unbucketed` rows are not eligible here or in the table — they list under Gaps only
(`pipeline.md` `## Bucket`), because the posting printed no route to judge them by.

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
- `live≥7` count > rows printed above (Do this first ∪ table, counted once) →
  `+{n} more live≥7 → `{abs Profile root}/scout/jobs/``
- Zero ≥8 rows → omit this heading and the table; still print the remainder line
  when `live≥7` > 0

### Gaps

Omit this heading when the list is empty.

- skipped: {source} ({reason})
- tool defects: {tool} ({reason})
- uncertain: {url or company} ({reason}) # only if any
- unbucketed: {company} — {title} (no printed work_auth, hiring_route, or location)

`skipped` also covers dry packs (`{pack_id} (dry)`). `tool defects` also covers
pack verdicts `defect: {name}`. Omit recovered fetches, location-gate drops,
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
- `verdict`: `pass`, `skipped: disabled`, or `defect: {name}`
