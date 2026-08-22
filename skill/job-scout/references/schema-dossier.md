# Job scout — dossier format

Phase 6 output. Main-only. Never paste into a worker brief. Workers never write.

## Layout (under Profile root)

`scout/jobs/` is created by this phase, never by `job-profile-init`. Never write
`scout/runs/`.

## Filename

`{first_seen}-{company}--{title}.md`. The date is the ISO day this dossier was
created and is **never** rewritten.

Slug part: lowercased; every run of non-alphanumerics → one `-`; trimmed.
Name taken by a file whose `url` differs → append `-2`, `-3`.

The date is a label, never a key. Re-run lookup is by frontmatter `url` across the
whole directory — the same job re-found lands on the file it already owns, whatever
date that name carries.

## File format

`company`, `title`, and `url` are copied from the posting, so they always ship
double-quoted, with any `"` or `\` inside escaped as `\"` / `\\`.
The fixed-vocabulary keys (`status`, `bucket`, `channel`), dates, and `score`
stay bare.

Body fields that are also posting-controlled (`company` / `title` in the H1,
`why`, posting-facts table values, `jd_excerpt`, provenance) must not invent
structure. Collapse every newline or run of whitespace in a single-line field to
one space before writing it into the body. Never emit the ownership marker
`<!-- scout never writes below this line -->` from any posting-derived value —
`jd_excerpt` stays line-prefixed with `>`.

```markdown
---
company: "Ambar"
title: "Senior Software Engineer"
url: "https://example.com/jobs/123" # normalized, per contract-search.md "URL normalize"
status: new # new | applied | rejected | interview | offer | dropped
first_seen: 2026-08-08
last_seen: 2026-08-08
score: 9 # 0–9, or — when the row is unscored
bucket: direct # bucket_short vocab, flow-rank.md `## Bucket`
channel: ats
---

# Ambar — Senior Software Engineer

## Verdict

score **9** · direct · live · {the search `why` string verbatim}

| skills | seniority | geo/auth |   = |
| -----: | --------: | -------: | --: |
|      7 |         2 |        — |   9 |

Factors and sum exactly as `flow-rank.md` `## Score` computed them. A mismatch is
a defect.

Unscored row — `## Score` returned `—` because the posting printed no
`required_skills`, or the profile carries no skills. Frontmatter `score: —`, the
Verdict line prints `score **—**`, and the `=` cell is `—`:

score **—** · direct · live · {the search `why` string verbatim}

| skills | seniority | geo/auth |   = |
| -----: | --------: | -------: | --: |
|      — |         2 |        — |   — |

Every factor keeps what it computed; one with no evidence stays `—`. Never write `0`
for an unknown factor, never omit the table, and never drop the row's bucket — a row
is unscored, not unbucketed.

## Posting facts

Every extract key from `contract-extract.md` except `jd_excerpt` (its own
`## From the posting` section), plus main-derived `blocker`. `—` = the page
did not print it.

| key             | value              |
| --------------- | ------------------ |
| status          | live               |
| status_reason   | —                  |
| seniority       | Senior             |
| work_model      | Remote             |
| location        | United Kingdom     |
| salary          | —                  |
| work_auth       | —                  |
| hiring_route    | contractor / B2B   |
| required_skills | TypeScript, Python |
| jd_date         | 2026-08-01         |
| blocker         | —                  |

`blocker` is main-derived (`flow-rank.md` `## Bucket`), not a gated column — recompute
it here; never read it off a row.

## From the posting

`jd_excerpt` verbatim in a blockquote, or `_(not printed)_` when `—`.

## Provenance

Labeled `source {value} · channel {value} · author {value} · date {value}` from the
search columns, `—` if unknown. Channel matches frontmatter. Include
` · contact {value}` only when contact is known; omit the slot when `—`.
Never re-derive; never invent a contact.

source ambar · channel ats · author — · date 2026-08-08

<!-- scout never writes below this line -->

- 2026-08-08 · found by scout — job-scout
```

## Log grammar

Every line any skill appends is one line, `- {YYYY-MM-DD} · {event} — {writer}`,
`{writer}` ∈ `job-scout` | `job-apply` | `job-inbox` | `operator` — readers also accept
`job-application`, the pre-rename spelling of `job-apply`, which writers never
emit. A line without a writer suffix is unclassifiable.

Scout writes exactly three events:

| Event         | Line                                                                  |
| ------------- | --------------------------------------------------------------------- |
| first persist | `- {date} · found by scout — job-scout`                               |
| closure       | `- {date} · posting dead: {status_reason \| not printed} — job-scout` |
| reopen        | `- {date} · posting live again — job-scout`                           |

**Posting-state lines are the closure and reopen lines only.** `found by scout`
is neither. A line whose writer is not `job-scout` is never posting state,
whatever it says.

Blocks appended below the log by `job-apply` or `job-inbox` may carry posting-derived
text. That text is blockquoted or held in table cells, never a bare top-level
`- ` line. Same injection law as the body: never emit the marker from a
posting-derived value.
Collapse every appended value to one line before writing it. A `>` prefix guards
only its own line — a newline inside a value emits an unprefixed line, and a bare
`- ` line sitting there is read as a log event. A value bound for a table cell also
has every `|` escaped as `\|`.

## Re-run rules

Everything from the opening `---` down to the ownership marker is scout-owned and
rewritten each run. Below that line, and `status:` in frontmatter, belong to the
operator, `job-apply`, and `job-inbox`.

| On re-run                                             | Do                                                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Same normalized `url` exists                          | Rewrite scout-owned body; bump `last_seen`; keep `first_seen` **and the existing filename**                                         |
| `status:` already set                                 | Never touch it — not even back to `new`                                                                                             |
| Ownership marker / log tail                           | Append below the marker; never rewrite or reorder existing log/application lines                                                    |
| Row now `dead`                                        | Append a log line; set no status; leave the body                                                                                    |
| Row `live` again after dead                           | Append a reopen log line; set no status; rewrite the body as normal                                                                 |
| No file yet                                           | Create with `status: new`                                                                                                           |
| File exists with no `## Verdict` (a `job-apply` stub) | Treat as an existing dossier: fill the scout-owned body for the first time, keep `status:`, `first_seen`, the filename, and the log |

A closure is an event in the log, not a field. Append the reopen line whenever a
URL whose last scout posting-state line was a closure is extracted live again.

For every create or update, obey `./contract-persistence.md`.
