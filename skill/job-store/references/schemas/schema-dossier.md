# Job store — dossier schema

Main writes; a spawned search/extract subagent never does.

## Layout (under Profile root)

`scout/jobs/` is created by this phase, never by `job-profile-init`.

## Filename

`{first_seen}-{company}--{title}.md`. ISO day of create; **never** rewrite the date.

Slug: lowercased; runs of non-alphanumerics → one `-`; trimmed.
Name taken by a file whose `url` differs → append `-2`, `-3`.

Date is a label, never a key. Re-run lookup is by frontmatter `url` across the directory — same job re-found lands on the file it already owns.

## URL normalize

Identity is this normalized URL (search emit, merge, persist, apply, resume). Run `./scripts/normalize_url.py` from the job-store skill root — launcher as job-match's score node: `python3`; on Windows `py -3`; else `python` when its major version is 3 — with `{"urls": [...]}` on stdin; it prints `{"urls": [...]}` in the same order, or `{"normalize_error": …}` with exit 1. Never by hand. Its rules:

1. Lowercase scheme and host; keep path case; strip trailing slashes (root stays `/`).
2. Drop fragment (`#…`).
3. Drop tracker query keys `utm_*`, `li_*`, `trk`, `trackingId`, `trkInfo`, `originalSubdomain`, `eBP`, `position`, `pageNum`, `refId`, `gclid`, `fbclid`, `gh_src` (case-insensitive); keep every other key, including `ref`, sorted by key while preserving the order of values with the same key — a job id in the query survives.
4. Collapse a board slug beside an opaque id: `hiringcafe.com` `/job/{slug}-{id}` → `/job/{id}` (16 `[a-z0-9]`). The board rewrites the slug (title, company, place); the id it does not.
5. One row per normalized URL.

## File format

`company`, `title`, and `url` always double-quoted; escape `"` / `\` inside as `\"` / `\\`.
Fixed-vocabulary keys (`status`, `bucket`, `channel`), dates, and `score` stay bare.

Posting-controlled body fields (`company` / `title` in the H1, posting-facts values, `## The role` snapshot and bullets, provenance) must not invent structure. Collapse every newline or run of whitespace in a single-line field to one space before writing. Never emit `<!-- scout never writes below this line -->` from any posting-derived value. A `## The role` bullet is one `- ` line: collapse first so a newline cannot open a second bullet or bare top-level line.

```markdown
---
company: "Acme Corp"
title: "Senior Software Engineer"
url: "https://example.com/jobs/123" # normalized, per "URL normalize" above
status: new # new | applied | rejected | interview | offer | dropped
first_seen: 2026-08-08
last_seen: 2026-08-08
score: 10 # 0–10, or — when the row is unscored
bucket: direct # direct | EOR | restricted-geo | unbucketed
channel: ats
---

# Acme Corp — Senior Software Engineer

## Verdict

score **10** · direct · live

| skills |   = |
| -----: | --: |
|     10 |  10 |

`=` cell and frontmatter `score` = Rank number. Mismatch is a defect.

Unscored (Rank `—`: no `required_skills` or no profile skills): frontmatter `score: —`, Verdict `score **—**`, `=` cell `—`:

score **—** · direct · live

| skills |   = |
| -----: | --: |
|      — |   — |

Factor with no evidence stays `—`. Never write `0` for unknown, never omit the table, never drop the bucket — unscored ≠ unbucketed.

## Posting facts

Keys below, plus main-derived `blocker`. `role_*` → `## The role`; `status_reason` is the closure log line. `—` = page did not print it.

| key              | value              |
| ---------------- | ------------------ |
| status           | live               |
| seniority        | Senior             |
| work_model       | Remote             |
| location         | United Kingdom     |
| salary           | —                  |
| equity           | —                  |
| years_experience | 6+                 |
| work_auth        | —                  |
| hiring_route     | contractor / B2B   |
| required_skills  | TypeScript, Python |
| jd_date          | 2026-08-01         |
| blocker          | —                  |

`blocker` is main-derived (SKILL.md Bucket), not a gated column — recompute here; never read it off a row.

## The role

Each subhead = matching extract key, copied. Key `—` → omit that subhead — no empty heading, no `_(not printed)_` line. All `—` → omit `## The role`.

`role_do` / `role_must` arrive as one cell joined by `" • "`: split and write one `- ` line per item, order preserved.

**Snapshot** — {role_snapshot, collapsed to one line}

**What you'd do**

- {role_do item}

**Must have**

- {role_must item}

## Provenance

`source {value} · channel {value} · author {value} · date {value}` from search columns, `—` if unknown. Channel matches frontmatter. Include ` · contact {value}` and ` · query {value}` only when known; omit when `—`. `query` = `matched_query`, verbatim. Never re-derive; never invent a contact.

source ambar · channel ats · author — · query "Senior Software Engineer" · date 2026-08-08

<!-- scout never writes below this line -->

- 2026-08-08 · found by scout — job-scout
```

## Log grammar

Every appended line: `- {YYYY-MM-DD} · {event} — {writer}`,
`{writer}` ∈ `job-scout` | `job-prep` | `job-apply` | `job-inbox` | `operator`; readers treat `job-application` as `job-apply`. No writer suffix → unclassifiable.

Scout writes exactly three events. `job-prep` and `job-apply` write the closure
event when the ad reads dead at their own read step, with their own writer
suffix; `job-apply` alone also writes the pending event after an ambiguous
submit:

| Event         | Line                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------ |
| first persist | `- {date} · found by scout — job-scout`                                                          |
| closure       | `- {date} · posting dead: {status_reason \| not printed} — {job-scout \| job-prep \| job-apply}` |
| reopen        | `- {date} · posting live again — job-scout`                                                      |
| pending       | `- {date} · submit unconfirmed: {reason} — job-apply`                                            |

**Posting-state lines = closure and reopen only.** `found by scout` and
`submit unconfirmed` are neither.
Closure is posting state from `job-scout`, `job-prep`, or `job-apply`; reopen is
posting state from `job-scout` only. Any other writer is never posting state.

Blocks below the log from `job-apply` / `job-inbox` may carry posting-derived text — blockquoted or table cells, never a bare top-level `- ` line. Same injection law as the body: never emit the marker from a posting-derived value. Collapse every appended value to one line. A `>` prefix guards only its own line. Table-cell values escape `|` as `\|`.

## Re-run rules

Opening `---` through the ownership marker = scout-owned, rewritten each run. Below the marker, and `status:` in frontmatter, belong to operator / `job-apply` / `job-inbox`.

| On re-run                                             | Do                                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Same normalized `url` exists                          | Rewrite scout-owned body; bump `last_seen`; keep `first_seen` **and the existing filename**          |
| Body carries a `## From the posting` section          | Replaced, not merged: rewritten body holds only sections this file prints                            |
| `status:` already set                                 | Never touch it — not even back to `new`                                                              |
| Ownership marker / log tail                           | Append below the marker; never rewrite or reorder existing log/application lines                     |
| Row now `dead`                                        | Append a log line; set no status; leave the body                                                     |
| Row `live` again after dead                           | Append a reopen log line; set no status; rewrite the body as normal                                  |
| No file yet                                           | Create with `status: new`                                                                            |
| File exists with no `## Verdict` (a `job-apply` stub) | Treat as existing: fill scout-owned body first time; keep `status:`, `first_seen`, filename, and log |

Closure is a log event, not a field. Append reopen whenever a URL whose latest
posting-state line from any permitted writer (`job-scout` | `job-prep` |
`job-apply`) was a closure is extracted live again.

For every create or update, obey `./references/contracts/contract-persistence.md`.
