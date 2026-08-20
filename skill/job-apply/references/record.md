# Record confirmed application

Open only after clear Submit success or explicit operator `sent`, `submitted`, or
`applied` confirmation. Recording is not submitting. This is the only phase that writes
the Profile root, and it writes only the dossier store.

Before writing, read and obey `job-scout/references/schema-dossier.md`. That file is the
sole authority for containment, URL normalization, quoting and escaping, injection
protection, filename allocation, URL locks, owner fencing, atomic placement, and lock
release. Do not reproduce or replace those mechanics here. Normalize identity with
`job-scout/references/contract-search.md`.

## Write scope and lifecycle

On an existing dossier, touch only frontmatter `status:` and new content appended below
`<!-- scout never writes below this line -->`; never rewrite the scout-owned body or
existing log lines. Re-scan by normalized URL under the schema-mandated lock before
choosing update or create.

| Existing dossier status | Result after confirmed application |
| --- | --- |
| `new` | `applied` |
| `applied` | unchanged |
| any other existing status, including `interview`, `offer`, `rejected`, and `dropped` | unchanged |
| no dossier | create with `status: applied` |

Always append the application log and record. A released non-`new` duplicate keeps its
status and uses the duplicate log line below. Never rewind a lifecycle state.

## Identity and write preconditions

Store identity is normalized URL only. Use the URL opened in Prepare or a URL printed in
the paste. If `### Ad` showed `—`, ask once:

`Source URL? Store identity is URL-only; I cannot record without one.`

Never invent or store `—` as `url:`. In a later session also ask for any missing company,
title, channel, and submission date (`YYYY-MM-DD`). Do not use the recording date as an
unstated submission date. Channel `—` must be resolved from the operator; never infer it.

If a Phase 0 company/title duplicate was only a title match and the URL does not
re-match, do not update that dossier. Re-scan under the URL lock and create a new URL
identity when no match exists.

## Same-session record

The application heading is:

`#### Application {YYYY-MM-DD} · {channel}`

Append, in order, the existing run's `### Ad`, `### Fit`, `### Selected`, and every
review section: Duplicate check (including release and first-application lines), Draft,
Form fields, Salary derivation, Attachments, Gate compliance, Untrusted content, then
`Added fields` only when the operator second-approved them. Do not re-derive, summarize,
or invent content. Keep operator-only rows as `operator`.

The log line is:

`- {YYYY-MM-DD} · applied via {channel} — job-apply`

A released non-`new` duplicate uses:

`- {YYYY-MM-DD} · applied via {channel} · was {status} — job-apply`

For a new dossier, use the schema's nine frontmatter keys, set `first_seen` and
`last_seen` to today, use the normalized URL, `channel` from `### Ad`, `score: —`, and
`bucket: unbucketed`. Its body is exactly:

```markdown
# {company} — {title}

## Application log

<!-- scout never writes below this line -->

- {today} · dossier opened by application, no scout run — job-apply
- {YYYY-MM-DD} · applied via {channel} — job-apply

#### Application {YYYY-MM-DD} · {channel}
{same-session record or later-session placeholder}
```

Do not fabricate Verdict, Posting facts, or Provenance.

## Later-session record

When the earlier `### Ad`, selection, and review are not in context, never reconstruct
them from the posting or memory. Re-identify URL, company, title, channel, and the actual
submission date before any write. Re-scan by URL, then follow the same schema update-or-
create path.

Append the application heading using the submission date and exactly one line:

`> record not available (confirmed in a later session)`

No section headings. Existing status follows the lifecycle table: only `new` becomes
`applied`; `interview`, `offer`, `rejected`, `dropped`, and every other non-`new` value
remain unchanged.

## Persistence encoding

Record approved run substance, not a raw markdown paste. Demote section headings under
the application heading. Write every non-heading content line as a blockquote (`> …`),
including list and table rows, so review text cannot forge a top-level tracker log event.
Never emit a bare `## Application log` or the marker from posting-derived text. Collapse
whitespace in single-line values as required by the schema. Never record passwords,
credentials, one-time codes, demographic/EEO answers held only by the operator, or any
value the run did not print and the operator did not approve.

## Close

After the schema-compliant write and lock release, print the dossier filename, log line,
and resulting `status:`. Then stop.
