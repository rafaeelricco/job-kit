# Job scout — report format

The output contract for `pipeline.md` Phase 5. Main-only, same as that file.
Never paste either into a worker brief.

## Report format

Emit markdown **exactly** in this section order, then hand back to `pipeline.md`
Phase 6 — the dossiers are written after this report and the run file after them,
and the **STOP** belongs at the end of that phase, not here.
Every section below is the chat deliverable. Only `## Persisted subset` reaches
disk — a section that repeats a dossier field is never written to the run file.
No preamble. No apply / message / connect / open-form language.

## Persisted subset

Phase 6 writes these sections to `scout/runs/{run_file}`, in this order, and nothing
else: **Header**, **Snapshot**, **Run manifest**, **People / TA**, **Dropped**,
**Query log**, **Gaps**.

Chat-only — never persisted, because every column already lives in a dossier:
Do this first, Best {home_market}-friendly, {home_market}-friendly (direct),
{home_market}-friendly (EOR), EU/US-only, Direct contacts, Score audit.

`Direct contacts` is chat-only because each row is the dossier's own `## Provenance`
contact plus its `channel:`. `People / TA` is persisted because those rows have no
dossier and exist nowhere else.

### Run manifest

Persisted only; never printed in chat.

| url | company | title | score |
| --- | ------- | ----- | ----: |

One row per row that reached a ranked table or `### Dropped`, `url` normalized per
`contract-search.md`. This is the entire per-job payload the run file keeps: it is
what lets two runs be diffed by URL after the dossier has moved on. `company` and
`title` are frozen at the run, exactly as `### Dropped` already prints them — a re-see
rewrites both in the dossier, so a manifest that stored neither could only be read
against whatever the posting says today, and what the run actually found would be gone.
Never add a bucket, channel, contact, blocker or why column here — those track the
posting rather than the run, and copying them back is exactly the drift this split removes.

### Header

`# Job Scout · {YYYY-MM-DD} · Deck={profile|kit fallback}`

### Snapshot

- Live scored ≥7: {n} (after company dedupe)
- Best {home_market}-friendly: {company} · {short_title} · {score}
- Direct-email hits: {n}
- Dead on extract: {n}
- Packs dry: {none|comma list}
- Saved: {n} dossiers · run `{abs Profile root}/scout/runs/{run_file}`

`{run_file}` is the collision-free name Phase 6 step 1 resolves — `{YYYY-MM-DD}-scout.md`,
or `-2` / `-3` when that is taken. Resolve it before rendering this line: Snapshot is a
persisted section and reaches disk unchanged, so an unsuffixed name here would make the
saved record point at an earlier run. The name is resolved early but the file is written
last, in Phase 6 step 4, so `Saved: {n} dossiers` only ever reaches disk when all `n`
landed.

### Do this first

Exactly 3 if ≥3 live score≥7 rows; fewer if not. Prefer {home_market}-direct over EU/US-only on ties.

1. **{company}** — {title} — score **{score}** — {bucket_short}
   {why ≤ 20 words} / {contact line if any} / {url}

### Best {home_market}-friendly

{company} · {title} · score {score} · {url}

### {home_market}-friendly (direct)

| #   | score | company | title | channel | contact | source | author | date | why | url |
| --- | ----: | ------- | ----- | ------- | ------- | ------ | ------ | ---- | --- | --- |

### {home_market}-friendly (EOR)

(same columns as {home_market}-friendly direct)

### EU/US-only

| score | company | title | blocker | source | author | date | url |
| ----: | ------- | ----- | ------- | ------ | ------ | ---- | --- |

### Direct contacts

| company | contact | channel | url |
| ------- | ------- | ------- | --- |

Public email or @handle only. Rows with no real contact cell → omit (no invent).
Name-only people profiles go to **People / TA** instead.

### People / TA

| name | role | company | profile_url | date_seen |
| ---- | ---- | ------- | ----------- | --------- |

From people-pack `### Contacts` only. Never invent contact/channel.

### Dropped

- dead: {company} — {title} ({reason})
- score <7: {score} {company} — {title} ({one-line why low})
- company-dedupe: {score} {company} — {title} (kept: {winner_title} · {winner_score})

### Score audit

| company | title | skills | seniority | geo/auth | salary | recency |   = |
| ------- | ----- | -----: | --------: | -------: | -----: | ------: | --: |

One row per row that entered a ranked table. Factors exactly per `pipeline.md` `## Score`.
The `=` column MUST equal the score printed in the ranked tables — a mismatch is a defect,
not a rounding.

### Query log

| pack      | formulations_run | row_runs | sources_hit |                  usable |                   zero_result_runs | verdict                |
| --------- | ---------------: | -------: | ----------: | ----------------------: | ---------------------------------: | ---------------------- |
| {pack_id} |              {n} |      {n} |         {n} | {n cards or n verified} | {n or list from worker Defect log} | pass \| defect: {name} |

One row per pack in the resolved deck (all packs every run, disabled ones included
with verdict `skipped: disabled`). Which deck won is named in the Header.
Carry `formulations_run` and `row_runs` as the worker printed them; `contract-search.md`
owns both. NEVER print one without the other.
Roll worker Defect log `zero_result_runs` even when `usable > 0` (partial dry packs stay visible).

### Gaps

- skipped: {source} ({reason})
- tool defects: {tool} ({reason})
- uncertain: {url or company} ({reason}) # only if any
- unbucketed: {company} — {title} (no printed work_auth, hiring_route, or location)

### Inclusion / hard rules

- Tables {home_market}-direct / {home_market}-EOR / EU-US: `status=live` AND `score≥7` AND after `apply_once_at_company`
- EU/US-only: score desc; `blocker` = printed geo/auth constraint only
- Ranked tables always carry `source`, `author`, `date` from search (`—` if unknown), so
  social and founder provenance stays auditable
- Unknown = `—` (never invent)
- Empty section → keep heading + `_(none)_`
- why ≤12 words in tables; ≤20 in Do this first

### Controlled vocab

- `bucket_short`: `{home_market}-direct` | `{home_market}-EOR` | `EU/US-only` | `unbucketed`
- `bucket` full: `{home_market}-friendly (direct)` | `{home_market}-friendly (EOR)` | `EU/US-only` | `unbucketed`
  (derivation table in `pipeline.md`, under `## Bucket`)
- `channel`: `direct_email` | `dm_request` | `founder` | `ats`
- `verdict`: `pass`, `skipped: disabled`, or `defect: {name}`
