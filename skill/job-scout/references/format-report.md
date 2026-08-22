# Job scout — report format

Phase 5 chat shape. Main-only. Never paste into a worker brief.

Emit markdown **exactly** in this section order, then hand back to `flow-scout.md`
Phase 6. **STOP** is the end of that phase, not here.
Chat only. Never a run file; never copy ranked tables or score factors to disk.
No preamble. No apply / message / connect / open-form language.

### Header

`# Job Scout · {YYYY-MM-DD} · {n} live≥7 · {n} contacts · {n} defects`

- `live≥7` — `status=live` and score ≥7
- `contacts` — public email or @handle across gated search rows. Named `contacts`,
  not `email`
- `defects` — pack verdicts `defect: {name}` **and** `auth_gate`, which
  `flow-scout.md` counts as a pack defect
- Never invent a run filename. Never print a write-success count.

### Do this first

Exactly 3 if ≥3 **eligible** rows; fewer if not, including none. Eligible = live,
score≥7, bucket ≠ `unbucketed`. Count the trigger on that same population.
Prefer direct over restricted-geo on ties.
The header's `live≥7` census stays unfiltered.

1. **{company}** — {title} — score **{score}** — {bucket_short}
   {why ≤ 20 words} / {contact if printed} / {url}

### Ranked

`status=live` AND `score≥8`, excluding `unbucketed`. Sort per `flow-rank.md` `## Channel sort`.
Rows already named in Do this first repeat here.

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
- Nothing printed above (every live≥7 row was `unbucketed`) →
  `{n} live≥7 → {abs Profile root}/scout/jobs/`. Never `+{n} more` there.

### Gaps

Omit this heading when the list is empty.

- skipped: {pack_id} ({reason})
- tool defects: {tool} ({reason})
- uncertain: {url or company} ({reason}) # only if any
- unscored: {company} — {title} (required skills not printed or profile skills empty)
- route disabled: {company} — {title} ({route} not enabled in profile)
- unbucketed: {company} — {title} (no printed route or restriction)
- kit drop: {company} — {title} ({reason})

`skipped` covers dry packs (`{pack_id} (dry)`). `tool defects` also covers pack
verdicts `defect: {name}` and `auth_gate`. Omit recovered fetches, location-gate
drops, disabled packs, never-live dead, and score<7 rows unless they are unscored.
