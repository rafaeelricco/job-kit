# Job tracker — answer shapes

Pick the shape the question asks for. Unknown = `—`, never invented.
Every shape ends with a `### Gaps` list naming files skipped, unparseable, or unreadable.

## All jobs

| company | title | status | score | bucket | last_seen | file |
| ------- | ----- | ------ | ----: | ------ | --------- | ---- |

Default sort: `status` group, then `score` desc. One row per dossier.
Say the count and the store path above the table.

## One job

Print a short **Lifecycle** header from frontmatter before the body sections:
`status` (lifecycle), `score`, `bucket`, `first_seen`, `last_seen`, `url`,
`channel`. Never confuse frontmatter `status` with Posting facts `status`
(`live`/`dead`/`uncertain`).

Print the dossier's own sections in its own order — Verdict, Posting facts, From the
posting, Provenance, Application log. Do not reformat, do not summarize `jd_excerpt`,
do not recompute the factor table.

## Status board

Group by frontmatter `status:`, count each group, list company + title under it.
A group with no rows is omitted. Dead-by-log jobs are named under their lifecycle
status with the closure date, never moved to a group of their own.

## Run diff

Two run files by name, compared on their `### Run manifest` rows. Report URLs new in
the later run, URLs gone from it, and score changes for URLs in both. Join each URL to
its dossier for company and title — the manifest carries neither. Read only the two
files named; never infer a run that is not on disk.
