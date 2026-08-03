# Job discovery — report format

The output contract for `orchestrator.md` Phase 5. Main-only, same as that file.
Never paste either into a worker brief.

## Report format

Emit markdown **exactly** in this section order, then **STOP**.
No preamble. No apply / message / connect / open-form language.

### Header

`# Job Scout · {YYYY-MM-DD} · LI={publicIdentifier|FAIL}`

### Snapshot

- Live scored ≥7: {n} (after company dedupe)
- Best {home_market}-friendly: {company} · {short_title} · {score}
- Direct-email hits: {n}
- Dead on extract: {n}
- Packs dry: {none|comma list}

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

One row per row that entered a ranked table. Factors exactly per `orchestrator.md` `## Score`.
The `=` column MUST equal the score printed in the ranked tables — a mismatch is a defect,
not a rounding.

### Query log

| pack      | formulations_run | row_runs | sources_hit |                  usable |                   zero_result_runs | verdict                |
| --------- | ---------------: | -------: | ----------: | ----------------------: | ---------------------------------: | ---------------------- |
| {pack_id} |               ≥3 |      {n} |         {n} | {n cards or n verified} | {n or list from worker Defect log} | pass \| defect: {name} |

One row per pack in `data/search_packs.yaml` (all packs every run).
Carry `formulations_run` and `row_runs` as the worker printed them; `contract.worker.md`
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
  (derivation table in `orchestrator.md`, under `## Bucket`)
- `channel`: `direct_email` | `dm_request` | `founder` | `ats`
- `verdict`: `pass` or `defect: {name}`
