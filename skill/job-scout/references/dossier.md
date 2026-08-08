# Job scout — dossier format

The output contract for `pipeline.md` Phase 6. Main-only, same as that file.
Never paste into a worker brief. Workers never write.

## Layout (under Profile root)

```
scout/
  runs/2026-08-08-scout.md              # Phase 5 markdown, verbatim
  jobs/ambar--senior-software-engineer.md
```

`scout/` is created by this phase, never by `job-profile-init`.

## Slug

`{company}--{title}`, lowercased; every run of non-alphanumerics → one `-`; trimmed.
Slug taken by a file whose `url` differs → append `-2`, `-3`.
No date in the name: the same job re-found must land on the same file.

## File format

`company`, `title`, and `url` are copied from the posting, so they always ship
double-quoted, with any `"` or `\` inside escaped as `\"` / `\\`. Unquoted they
break the file for ordinary postings: `Engineer: Platform` makes the frontmatter
invalid, `Engineer #2` and a `#` URL fragment truncate to a comment. Either way
the re-run match and the application duplicate check stop finding the dossier.
The fixed-vocabulary keys (`status`, `bucket`, `channel`), dates, and `score`
stay bare.

```markdown
---
company: "Ambar"
title: "Senior Software Engineer"
url: "https://example.com/jobs/123" # normalized, per contract-search.md "URL normalize"
status: new # new | applied | rejected | interview | offer | dropped
first_seen: 2026-08-08
last_seen: 2026-08-08
score: 8
bucket: BR-direct # bucket_short vocab, scout-report.md
channel: ats
---

# Ambar — Senior Software Engineer

## Verdict

score **8** · BR-direct · live · {the search `why` string verbatim}

| skills | seniority | geo/auth | salary | recency |   = |
| -----: | --------: | -------: | -----: | ------: | --: |
|      4 |         2 |        2 |      0 |       0 |   8 |

Factors and sum exactly as `### Score audit` printed them. A mismatch is a defect.

## Posting facts

Every extract key from `contract-extract.md`. `—` = the page did not print it.

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

`blocker` is main-derived (`pipeline.md` `## Bucket`), not a gated column — recompute
it here; never read it off a row.

## From the posting

`jd_excerpt` verbatim in a blockquote, or `_(not printed)_` when `—`.

## Provenance

source · author · contact · date — all four from the search columns, `—` if unknown.
Never re-derive; never invent a contact.

## Application log

<!-- scout never writes below this line -->

- 2026-08-08 · found by scout · run `scout/runs/2026-08-08-scout.md`
```

## Re-run rules

Everything from the opening `---` down to `## Application log` is scout-owned and
rewritten each run. Below that line, and `status:` in frontmatter, belong to the
operator and `job-application`.

| On re-run                    | Do                                                            |
| ---------------------------- | ------------------------------------------------------------- |
| Same normalized `url` exists | Rewrite scout-owned body; bump `last_seen`; keep `first_seen` |
| `status:` already set        | Never touch it — not even back to `new`                       |
| `## Application log`         | Append one line; never rewrite or reorder existing lines      |
| Row now `dead`               | Append a log line; set no status; leave the body              |
| No file yet                  | Create with `status: new`                                     |

Unknown = `—`, never invented — same law as the report.
