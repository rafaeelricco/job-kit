# Job scout — dossier format

The output contract for `pipeline.md` Phase 6. Main-only, same as that file.
Never paste into a worker brief. Workers never write.

## Layout (under Profile root)

```
scout/
  jobs/2026-08-08-ambar--senior-software-engineer.md
```

`scout/jobs/` is created by this phase, never by `job-profile-init`. Never write
`scout/runs/`.

## Filename

`{first_seen}-{company}--{title}.md`. The date is the ISO day this dossier was
created and is **never** rewritten — not when `last_seen` moves, not when the body
is rebuilt, not when `status:` changes.

Slug part: lowercased; every run of non-alphanumerics → one `-`; trimmed.
Name taken by a file whose `url` differs → append `-2`, `-3`.

The date is a label, never a key. Re-run lookup is by frontmatter `url` across the
whole directory — the same job re-found lands on the file it already owns, whatever
date that name carries. Deriving today's date and writing there creates a second file
for one job and orphans the operator's `status:` and log.

## File format

`company`, `title`, and `url` are copied from the posting, so they always ship
double-quoted, with any `"` or `\` inside escaped as `\"` / `\\`. Unquoted they
break the file for ordinary postings: `Engineer: Platform` makes the frontmatter
invalid, `Engineer #2` and a `#` URL fragment truncate to a comment. Either way
the re-run match and the application duplicate check stop finding the dossier.
The fixed-vocabulary keys (`status`, `bucket`, `channel`), dates, and `score`
stay bare.

Body fields that are also posting-controlled (`company` / `title` in the H1,
`why`, posting-facts table values, `jd_excerpt`, provenance) must not invent
structure. Collapse every newline or run of whitespace in a single-line field to
one space before writing it into the body (same rule as the run manifest). Never
emit a bare `## Application log` line or the ownership marker
`<!-- scout never writes below this line -->` from any posting-derived value —
`jd_excerpt` stays line-prefixed with `>` so a forged heading or marker cannot
become a second ownership boundary. Without that, a title or excerpt that
carries those bytes can split scout-owned body from the real log, forge a
closure the tracker reads as posting state, and leave re-run preservation with
two candidate cut lines.

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

`blocker` is main-derived (`pipeline.md` `## Bucket`), not a gated column — recompute
it here; never read it off a row.

## From the posting

`jd_excerpt` verbatim in a blockquote, or `_(not printed)_` when `—`.

## Provenance

source · author · contact · date — all four from the search columns, `—` if unknown.
Never re-derive; never invent a contact.

## Application log

<!-- scout never writes below this line -->

- 2026-08-08 · found by scout — job-scout
```

## Application log grammar

Every line any skill appends is one line, `- {YYYY-MM-DD} · {event} — {writer}`,
`{writer}` ∈ `job-scout` | `job-application` | `operator`. The writer suffix is
what makes the tracker's bottom-up scan deterministic; a line without one is
unclassifiable.

Scout writes exactly three events:

| Event         | Line                                                                  |
| ------------- | --------------------------------------------------------------------- |
| first persist | `- {date} · found by scout — job-scout`                               |
| closure       | `- {date} · posting dead: {status_reason \| not printed} — job-scout` |
| reopen        | `- {date} · posting live again — job-scout`                           |

**Posting-state lines are the closure and reopen lines only.** `found by scout`
is neither. A line whose writer is not `job-scout` is never posting state,
whatever it says.

Blocks appended below the log by `job-application` may carry posting-derived
text. That text is blockquoted or held in table cells, never a bare top-level
`- ` line, so it cannot forge a posting-state line. Same injection law as the
body: never emit a bare `## Application log` or the marker from a
posting-derived value.

## Re-run rules

Everything from the opening `---` down to `## Application log` is scout-owned and
rewritten each run. Below that line, and `status:` in frontmatter, belong to the
operator and `job-application`.

| On re-run                                                   | Do                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Same normalized `url` exists                                | Rewrite scout-owned body; bump `last_seen`; keep `first_seen` **and the existing filename**                                         |
| `status:` already set                                       | Never touch it — not even back to `new`                                                                                             |
| `## Application log`                                        | Append one line; never rewrite or reorder existing lines                                                                            |
| Row now `dead`                                              | Append a log line; set no status; leave the body                                                                                    |
| Row `live` again after dead                                 | Append a reopen log line; set no status; rewrite the body as normal                                                                 |
| No file yet                                                 | Create with `status: new`                                                                                                           |
| File exists with no `## Verdict` (a `job-application` stub) | Treat as an existing dossier: fill the scout-owned body for the first time, keep `status:`, `first_seen`, the filename, and the log |

A closure is an event in the log, not a field — so the only thing that can undo
one is a later event. Rewriting the body back to `live` does not: the tracker
reads posting state bottom-up from the log, finds the earlier closure sitting
last, and reports the job dead while the body says otherwise. Append the reopen
line whenever a URL whose last scout posting-state line was a closure is
extracted live again.

Unknown = `—`, never invented — same law as the report.

Replace an existing dossier atomically: render the complete updated file to a
sibling temporary path under the same `scout/jobs/` directory, then rename it
over the original once the write has succeeded. Never rewrite one in place. The
operator owns `status:` and `## Application log`, and an in-place write that dies
partway — a full disk is enough — truncates exactly those lines. The pre-write
readability and parse checks cannot help once the write has begun; a rename is
the only step that either happens or does not.

**Concurrent writers (job-scout Phase 6 and job-application Phase 4):** atomic
rename alone does not prevent lost updates when both read the same base, each
render a full replacement, and the later rename drops the earlier writer's
`status:` / log or scout body. Every update of an existing dossier is therefore
optimistic compare-and-retry:

1. Read the whole file as `base` (byte-identical snapshot of what you will
   preserve).
2. Apply only this writer's allowed edits to that base; render the full result
   to the sibling `*.md.tmp`.
3. Re-read the live path. If its bytes still equal `base`, rename the tmp over
   it. If they differ, discard the tmp, treat the new content as `base`, and
   retry from step 2 — another writer landed first.
4. Cap at 3 attempts. Still racing → **STOP**, name the file, tell the operator
   the write did not land (and for job-application: set `status: applied` by
   hand). Never force the rename over a changed base.

Create path: write a new filename only when the re-scan by normalized `url`
found none. If the create races (name appears, or a URL match appears mid-write),
abandon create and take the update path above on the winner. Never leave two
files for one `url`.
