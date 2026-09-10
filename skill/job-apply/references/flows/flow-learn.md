# Learn — seed the answer library

Runs once after the last posting, before the inbox leg. Writes
`data/candidate.yaml` `screening_defaults.qa[]` and nothing else.

Collect, across every posting this run opened a form on, each label the
resolution order in `contract-screening.md` could not answer from rules 1-3 —
what rule 7 left blank or stopped on. A label a Fact file, a derived answer, or
an existing `qa[]` row already answers is covered; do not write it.

Never write a label classified demographic or EEO (`contract-screening.md`
rule 6). Never write an `answer` value, a password, a one-time code, or an
authentication link. The operator fills answers; this leg only asks.

Row shape is the one `job-profile-me/references/flows/flow-mutate.md` defines
for `screening_defaults.qa[]`. Per row: `question` is the form label as printed,
collapsed to one line; `answer` is `""`; `source` is `job-apply · {slug}`;
`confirmed_at` is today. Omit `scope`.

Drop a row whose `question` normalizes equal to an existing `qa[]` row's, and
collapse duplicates within the run, by the normalization in
`contract-screening.md` rule 3. Nothing left → write nothing and say so.

Write once for the whole run under
`job-profile-me/references/flows/flow-mutate.md` staging law: render to the
`*.yaml.tmp` sibling, append at the tail of `qa[]` in collection order, edit
surgically, never re-serialize, never drop a comment or a key outside the
appended rows, re-parse, then rename over the original. A parse failure
discards the staging file and writes nothing.

Print `qa += {question}` per appended row, then the count. Nothing appended, or
a discarded staging file, prints one line saying so and no count.
