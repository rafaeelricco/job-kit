# Match — report shape

`# Job Match · {YYYY-MM-DD} · {n} ranked · {n} blocked · {n} gaps`

Then the ranked table (match_score desc; ties → higher confidence):

| Rank | Company | Title | Match | Conf | Decision        | Scout | Why            |
| ---: | ------- | ----- | ----: | ---: | --------------- | ----: | -------------- |
|    1 | …       | …     |    91 |  92% | excellent_match |     8 | stack + senior |

`Scout` = frontmatter `score` for display only — never recompute it.
`Why` = first strength, else first gap, else blocker.

Then optional `### Top detail` for rank 1–5 (or all if ≤5):

`{company} — {title}`
`match {n} · {decision} · conf {n}`
`strengths: …`
`gaps: …`
`breakdown: primary_stack={n} …` (`null` cells print `—`)

Then `### Blocked` (`state.blocked`) if any: `company — title · reason`

Then `### Gaps` — unparseable files, malformed extract/match/validate output,
arith that cannot hold. Omit if empty.
