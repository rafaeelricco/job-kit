# Job scout — dossier format

The output contract for `flow-scout.md` Phase 6. Main-only, same as that file.
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
score: 9
bucket: direct # bucket_short vocab, format-report.md
channel: ats
---

# Ambar — Senior Software Engineer

## Verdict

score **9** · direct · live · {the search `why` string verbatim}

| skills | seniority | geo/auth |   = |
| -----: | --------: | -------: | --: |
|      7 |         2 |        — |   9 |

Factors and sum exactly as Phase 5 `## Score` computed them. A mismatch is a defect.

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

`blocker` is main-derived (`flow-scout.md` `## Bucket`), not a gated column — recompute
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
`{writer}` ∈ `job-scout` | `job-apply` | `operator` — readers also accept
`job-application`, the pre-rename spelling of `job-apply`, which writers never
emit. The writer suffix is
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

Blocks appended below the log by `job-apply` may carry posting-derived
text. That text is blockquoted or held in table cells, never a bare top-level
`- ` line, so it cannot forge a posting-state line. Same injection law as the
body: never emit a bare `## Application log` or the marker from a
posting-derived value.

## Re-run rules

Everything from the opening `---` down to `## Application log` is scout-owned and
rewritten each run. Below that line, and `status:` in frontmatter, belong to the
operator and `job-apply`.

| On re-run                                             | Do                                                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Same normalized `url` exists                          | Rewrite scout-owned body; bump `last_seen`; keep `first_seen` **and the existing filename**                                         |
| `status:` already set                                 | Never touch it — not even back to `new`                                                                                             |
| `## Application log`                                  | Append one line; never rewrite or reorder existing lines                                                                            |
| Row now `dead`                                        | Append a log line; set no status; leave the body                                                                                    |
| Row `live` again after dead                           | Append a reopen log line; set no status; rewrite the body as normal                                                                 |
| No file yet                                           | Create with `status: new`                                                                                                           |
| File exists with no `## Verdict` (a `job-apply` stub) | Treat as an existing dossier: fill the scout-owned body for the first time, keep `status:`, `first_seen`, the filename, and the log |

A closure is an event in the log, not a field — so the only thing that can undo
one is a later event. Rewriting the body back to `live` does not: the tracker
reads posting state bottom-up from the log, finds the earlier closure sitting
last, and reports the job dead while the body says otherwise. Append the reopen
line whenever a URL whose last scout posting-state line was a closure is
extracted live again.

Unknown = `—`, never invented — same law as the report.

Replace an existing dossier atomically: render the complete updated file, then
rename it over the original once the write has succeeded. Never rewrite one in
place. Under concurrent writers the stage path is the URL lock's
`place-{owner}` file (below); a free-standing sibling `*.md.tmp` is not a fenced
place source. The operator owns `status:` and `## Application log`, and an
in-place write that dies partway — a full disk is enough — truncates exactly
those lines. The pre-write readability and parse checks cannot help once the
write has begun; a rename is the only step that either happens or does not.

**Concurrent writers (job-scout Phase 6 and job-apply Phase 5):** atomic
rename alone does not prevent lost updates — and check-then-rename is still a
race. Serialize **by normalized `url`**, not by intended filename: two writers
can pick different basenames for the same URL (midnight straddle, multi-title
extract) and filename locks would not meet.

**Store directory first (containment before create).** Before any lock or
`mkdir`: resolve the prospective `scout/jobs` path via its deepest existing
ancestor and **STOP** unless that physical path is still under the canonical
Profile root. Only then `mkdir -p scout/jobs` when absent. A missing parent
makes every lock `mkdir` fail permanently and is not contention — first-use
must create the store before acquire, but never through an out-of-tree symlink.

Lock path (bounded — long ATS URLs must not hit `ENAMETOOLONG`):

`scout/jobs/url-{url-digest}.lock`

where `{url-digest}` is the first 32 hex characters of the SHA-256 of the
normalized URL bytes (UTF-8), lowercased. Compute with a local digest tool
(`shasum -a 256`, `sha256sum`, `openssl dgst -sha256`). Same normalized URL →
same digest → same lock. Do **not** put the raw slug in the path name.

Lock directories, their `owner` metadata file, and lock-internal place staging
(`*.lock/place-*`) are writable path shapes (Phase 6 SSOT / job-apply
Phase 5 writable store); create only under `scout/jobs/`, never elsewhere.

Hold the URL lock across the full create-or-update:

1. **Acquire.** Exclusive-create the lock directory via `mkdir` — it fails when
   the directory already exists, and that failure _is_ the lock. Never use a
   plain file create, which can clobber.
   - Succeeded → **immediately** write a unique `owner` token (PID + random)
     inside the lock dir, before any dossier read or write. Keep the token;
     every later step re-reads it.
   - Failed, directory **≤ 15 minutes** old (directory mtime, set at `mkdir`) →
     another writer holds it. Wait briefly and retry, cap 5 attempts / ~10s.
     Still held → **STOP**, name the URL, and tell the operator the write did
     not land (job-apply: set `status: applied` by hand).
   - Failed, directory **> 15 minutes** old → the holder crashed or was
     interrupted. This is the branch that actually fires: agent sessions die
     mid-phase, and without reclaim that URL is wedged forever. Remove the stale
     directory and retry acquire once. A missing `owner` file means the writer
     died between `mkdir` and metadata init — still stale, still reclaimable.
   - Permanent errors (permission, read-only FS) → **STOP**, do not spin.
2. **Under the lock.** Re-read `owner`; missing or ≠ your token → **STOP**
   without writing. Your lock was reclaimed while you were away, and a writer
   that lost ownership must not go on to write. Then re-scan `scout/jobs/` for
   this normalized `url` and render the **complete** file to
   `scout/jobs/url-{url-digest}.lock/place-{owner-token}.md`. Staging inside the
   lock directory — never a free-standing `*.md.tmp` — is what makes reclaiming
   a lock also remove the abandoned stage.
   - **Match** → apply only this writer's allowed edits to the file you read.
   - **No match** → create. Filename allocation is exclusive even across
     different URLs, since two postings can share company+title: try the
     unsuffixed name, then `-2`, `-3`.
3. **Commit.** Re-read `owner` one last time; missing, unreadable, or ≠ your token
   → **STOP**. Then move the place file onto the final dossier path:
   - **Update** (a file already owns this `url`) → plain `mv`, an atomic replace.
   - **Create** (the name must not already exist) → hard-link then unlink:
     `ln place final && rm place`. `ln` exits nonzero when the name is taken,
     which is what makes a collision detectable — bump the suffix and re-stage.
     Do **not** use `mv -n`: on macOS it exits 0 without replacing, so the
     collision reads as success and the dossier is silently never written.
     Never open or write the final `.md` path directly — a cancelled or partial
     write leaves a truncated, unparseable dossier and blocks later persistence.
     On **either** path — if the place file is gone, or the move fails for any reason
     other than a taken name → **STOP** without further writes. Your lock was reclaimed
     while you were away; never re-render and never invent another source path.
     Re-rendering here is what turns a lost lock into a lost update on the replace path,
     or a second file for one `url` on the create path.
4. **Release.** Read `owner` at the lock path. Equals your token → remove the
   lock directory. Missing, unreadable, or a different token → leave it
   completely untouched; it is not yours, and deleting it would free a live
   writer's lock.

Never create or rename a dossier for a URL without holding that URL's lock.
Never skip the lock because "only one agent is running" — Phase 6 and Phase 5
are independent skills. Never leave two files for one `url`.
