# Job tracker — reading the store

Read-only. Paths relative to the Profile root resolved in `SKILL.md`.
Format SSOT is `job-scout/references/{dossier,scout-report,contract-extract}.md`;
this file records only what a reader must not get wrong.

## Two different words spelled `status`

| where                           | vocabulary                                               | owner     |
| ------------------------------- | -------------------------------------------------------- | --------- |
| frontmatter `status:`           | `new` `applied` `rejected` `interview` `offer` `dropped` | operator  |
| `## Posting facts` row `status` | `live` `dead` `uncertain`                                | job-scout |

Never answer a lifecycle question from the Posting facts row, or a posting question
from frontmatter.

## A dead job never says dead in frontmatter

The lifecycle vocab has no `dead` value. When a job dies, scout appends one line under
`## Application log` and leaves the body — so `## Verdict` still reads `live` and the
Posting facts `status` row still reads `live`. The newest log line is the only evidence.
Report the closure from it and say the body is frozen at `last_seen`.

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
  under `### Dropped`.

## Run file shape

Section order and columns: `job-scout/references/scout-report.md` "Persisted subset" —
the report's other sections are printed in chat and never reach disk, so do not expect
a ranked table or a Score audit in a run file. Read it there; it changes when the report
changes. The one thing that file will not tell a reader: the emitted run file has no H2
at all, so `##` never marks a section.

A run file holds only what is true of the run. Per-job description — title, bucket,
channel, contact, blocker, why — is dossier-owned and is not in here; `### Run manifest`
carries `url` and that run's `score`, and nothing else. Answer any descriptive question
from the dossier the `url` joins to.

Run files written before that split also carry ranked tables and a Score audit. Read them
if present, but never treat their columns as current — the dossier wins.

## Known contradiction, do not resolve it

`dossier.md` "Re-run rules" bumps `last_seen` when the same `url` is seen again, and
in the same table says a now-dead row leaves the body. Whether a dead re-run bumps
`last_seen` is undefined. Report the stored value and the newest log line; never
reconcile them.
