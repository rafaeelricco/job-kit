# Job scout — rank

`score` 0–10 = the share of `required_skills` covered by `data/skills.yaml` `skills[].items`, 10 being all. Covered is direct, not adjacent — `React.js` covers `React`, Vue does not. Either list empty → unscored (`—`).

Bucket, first match — dossier frontmatter only, never chat: printed EOR route and kit EOR Yes → `EOR`; printed contractor/B2B and kit contractor Yes, or location matches `direct_regions` → `direct`; printed hire-from restriction → `restricted-geo`; else `unbucketed`.

Persist set = `./references/flows/flow-match-gate.md`. Chat lists that set, score desc. No other sort.

`# Job Scout · {YYYY-MM-DD} · {n} live · {n} contacts · {n} defects`

- `live` = persist-set size
- `contacts` = public email or @handle on those rows
- `defects` = pack verdicts `defect: {name}` and `auth_gate`

Then each persist-set row:

`{score}  {company} — {title}`
`   {url}`

Then `{n} dossiers → {abs Profile root}/scout/jobs/`

`### Gaps` — skipped, tool defects, uncertain, kit drop, score≤7, match below bar, match blocked. Omit if empty.
