# profile_card.yaml

Optional cache of the card `show` otherwise derives. Written only by `refresh-card`,
only after diff → yes. job-scout does not read it today — it derives the card from
globbed `data/*.{yaml,yml}`, so writing this file changes nothing scout does.

## Schema

```yaml
primary_role: ""
seniority: ""
top_skills: []
industries: []
languages: []
target_stack: []
summary: "" # 1-3 sentences, facts only
updated_at: "" # ISO date this file was written
```

## Derivation — files on disk only

| Field | Source |
| --- | --- |
| `primary_role` | `job_search.yaml` `positions[0]`, else most recent `experiences.yml` `position` |
| `seniority` | `job_search.yaml` `experience_level` — the `true` keys, joined |
| `top_skills` | `skills.yaml` `skills[].items`, categories in file order; never re-ranked by judgement |
| `industries` | `experiences.yml` `company` / `summary` only where the summary names one; else `[]` |
| `languages` | `languages.yaml` `languages[].name` + `description` verbatim; never infer a cert or level |
| `target_stack` | `job_search.yaml` `keywords.*` values, groups in file order |
| `summary` | 1-3 sentences built only from the fields above |
| `updated_at` | ISO date at write time |

`experiences.yml` is a bare list at the document root and each `summary` is one
scalar string of `•` bullets joined by `\n` — read it as text, not as a list.

Empty is allowed everywhere. Unknown stays `""` or `[]`. Never fill a field to make
the card look complete.
