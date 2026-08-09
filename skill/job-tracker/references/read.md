# Job tracker — reading the store

Read-only. Paths relative to the Profile root resolved in `SKILL.md`.
Writer law for dossiers and run files lives with job-scout; this file is the
**reader mirror** agents-channel trackers must obey without that skill installed.

## Two different words spelled `status`

| where                           | vocabulary                                               | owner     |
| ------------------------------- | -------------------------------------------------------- | --------- |
| frontmatter `status:`           | `new` `applied` `rejected` `interview` `offer` `dropped` | operator  |
| `## Posting facts` row `status` | `live` `dead` `uncertain`                                | job-scout |

Never answer a lifecycle question from the Posting facts row, or a posting question
from frontmatter.

## Frontmatter (reader)

Required keys on a dossier: `company`, `title`, `url`, `status`, `first_seen`,
`last_seen`, `score`, `bucket`, `channel`. Lifecycle `status` ∈
`new` | `applied` | `rejected` | `interview` | `offer` | `dropped` (operator-owned).
Quoted dynamic scalars may appear for company/title/url.

## A dead job never says dead in frontmatter

The lifecycle vocab has no `dead` value. When a job dies, scout appends one line under
`## Application log` and leaves the body — so `## Verdict` still reads `live` and the
Posting facts `status` row still reads `live`. Scan the Application log **bottom-up**
for the latest **scout posting-state** line (closure / now-dead evidence written by
scout). Do **not** treat an operator or job-application line that merely sits last as
closure. If no scout posting-state line exists, the job is not dead-by-log. When one
does, report the closure from it and say the body is frozen at `last_seen`.

## Ownership boundary

Opening `---` down to the `## Application log` heading is scout-owned and rewritten every
run. `status:` and every line under the log belong to the operator and job-application.
Marker line, byte-exact: `<!-- scout never writes below this line -->`.

## A file in scout/jobs/ is not necessarily a dossier

Scout replaces a dossier by rendering to a sibling temp path in the same directory and
renaming over the original. A glob can catch that temp file mid-write. Anything that does
not parse as a dossier is not one: skip it, name it under Gaps, never repair it.

## bucket is profile-dependent

`BR-direct`, `BR-EOR`, `EU/US-only`, `unbucketed` — the prefix is `home_market` from
`data/candidate.yaml`. Read the literal; never hard-code the enum.

## Joining runs to dossiers

Join on normalized `url` only — the filename is not an id. A dossier is named
`{first_seen}-{company}--{title}.md`; the date is the day it was created, so it does
not track `last_seen`, and a `-2` suffix means two dossiers share one base, told
apart only by `url`.

- In a run file, no dossier: `uncertain` rows, and `dead` rows never seen live.
- Dossier, in no current run file: everything found by an earlier run.
- `score<7` and company-dedupe losers do have dossiers; the run file lists them only
  under `### Dropped` (and as `url | company | title | score` rows in `### Run manifest`).

## Run file shape

Persisted section order (H3 only — run files have no H2): Header, Snapshot,
Run manifest, People/TA, Dropped, Query log, Gaps. Chat-only ranked tables and
Score audit are not on disk — do not expect them.

A run file holds only what is true of the run. Per-job description — bucket, channel,
contact, blocker, why — is dossier-owned and is not in here; `### Run manifest` carries
`url` plus that run's `company`, `title`, and `score`, and nothing else (one row per
ranked or Dropped URL). Those three are frozen at the run and are the answer for what
that run found. Every other descriptive question is answered from the dossier the `url`
joins to — which is current state, not run state, and say so when the two disagree.

Run files written before that split also carry ranked tables and a Score audit. Read them
if present, but never treat their columns as current — the dossier wins. An older manifest
may carry only `url | score`; there, join to the dossier for company and title and label
them current rather than as-of-run.

## Known contradiction, do not resolve it

Scout re-run rules bump `last_seen` on a live re-see and leave the body on dead;
whether a dead re-run bumps `last_seen` is undefined. Report the stored value and
the latest scout posting-state log line; never reconcile them.
