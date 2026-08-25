# profile_card.yaml

Optional cache of the card `show` otherwise derives. Written only by `refresh-card`,
only after diff → yes. job-scout globs `data/*.{yaml,yml}` and may sweep this
file in — which is exactly why the same-cycle stale-field clearing below matters.
`show` never prefers this cache for `primary_role`
(always re-derived from `job_search.yaml`); a `set` that touches that source also
clears the field here so a raw read cannot advertise a stale value.

## Schema

```yaml
primary_role: ""
top_skills: []
industries: []
languages: []
summary: "" # 1-3 sentences, facts only
updated_at: "" # ISO date this file was written
```

## Derivation — files on disk only

| Field          | Source                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------- |
| `primary_role` | `job_search.yaml` `positions[0]`, else most recent `experiences.yml` `position`              |
| `top_skills`   | `skills.yaml` `skills[].items`, categories in file order; never re-ranked by judgement       |
| `industries`   | `experiences.yml` `company` / `summary` only where the summary names one; else `[]`          |
| `languages`    | `languages.yaml` `languages[].name` + `level` verbatim; never invent a cert or numeric scale |
| `summary`      | 1-3 sentences built only from the fields above                                               |
| `updated_at`   | ISO date at write time                                                                       |

`experiences.yml` is a bare list at the document root and each `summary` is one
scalar string of `•` bullets joined by `\n` — read it as text, not as a list.

Empty is allowed everywhere. Unknown stays `""` or `[]`. Never fill a field to make
the card look complete.
