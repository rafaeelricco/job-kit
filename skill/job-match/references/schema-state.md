# Match state

Orchestrator holds this object in-session. Nodes write only their keys. Never a file.

```json
{
  "candidate": null,
  "jobs": [],
  "blocked": [],
  "matches": [],
  "gaps": []
}
```

`blocked[]`: `{ "company", "title", "url", "reason" }`.
`gaps[]`: `{ "url" | "path", "reason" }`.

## CandidateProfile

`state.candidate`. Derive once from disk. Workers never re-read Profile root.

| Field                             | Source                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `roles`                           | `job_search.yaml` `positions[]`                                                                     |
| `skills`                          | `job-profile-me/references/schema-profile-card.md` `top_skills`                                     |
| `domains`                         | same file, `industries`                                                                             |
| `languages`                       | same file, `languages` as `{name: level}`                                                           |
| `experience`                      | `experiences.yml` `date` · `position` · `company` per role; no `summary`                            |
| `years_experience`                | floor(unique calendar months / 12) from `experience[].date` matching `{Mon[.] YYYY} -- {Mon[.] YYYY | Present}`(full or 3-letter month, optional`.`, inclusive union, `Present`= current month); no parseable roles or`experience=[]`→`null` not 0 |
| `preferences.remote`              | `candidate.yaml` `work_preferences_from_resume.remote_work`                                         |
| `preferences.in_person`           | `in_person_work`                                                                                    |
| `preferences.relocation`          | `open_to_relocation`                                                                                |
| `constraints.work_model`          | `job_search.yaml` `work_model`                                                                      |
| `constraints.locations`           | `job_search.yaml` `locations`                                                                       |
| `constraints.location_scope`      | `job_search.yaml` `location_scope`                                                                  |
| `constraints.exclude_locations`   | `job_search.yaml` `exclude_locations`                                                               |
| `constraints.market_currencies`   | `job_search.yaml` `market_currencies`                                                               |
| `constraints.legal_authorization` | `candidate.yaml` `legal_authorization`                                                              |

```json
{
  "roles": [],
  "skills": [],
  "domains": [],
  "languages": {},
  "experience": [{ "date": "", "position": "", "company": "" }],
  "years_experience": null,
  "preferences": { "remote": "", "in_person": "", "relocation": "" },
  "constraints": {
    "work_model": {},
    "locations": [],
    "location_scope": "",
    "exclude_locations": [],
    "market_currencies": [],
    "legal_authorization": {}
  }
}
```

Empty stays `""` / `[]` / `null`. Never fill to look complete. No `seniority` key — matchers read `experience[].position`.

## JobProfile

Extractor output. Unknown → `null` or `[]`. Copy printed tokens only.

```json
{
  "url": "",
  "company": "",
  "title": "",
  "scout_score": null,
  "seniority": null,
  "work_model": null,
  "location": null,
  "salary": null,
  "years_experience": null,
  "work_auth": null,
  "hiring_route": null,
  "required_skills": [],
  "preferred_skills": [],
  "languages_required": [],
  "languages_preferred": [],
  "domain": null
}
```

Posting-facts keys copy when not `—`. Human-language names printed under **Must have** → `languages_required` (name as printed); "advantage" / nice-to-have → `languages_preferred`. Programming languages stay in `required_skills`. Other `preferred_skills` / `domain` from `## The role` only when printed. `scout_score` = frontmatter `score` (`—` → `null`).

## MatchResult

Matcher output.

```json
{
  "url": "",
  "match_score": 0,
  "decision": "strong_match",
  "confidence": 0.0,
  "blockers": [],
  "strengths": [],
  "gaps": [],
  "score_breakdown": {
    "primary_stack": null,
    "experience": null,
    "seniority": null,
    "role_type": null,
    "location": null,
    "domain": null,
    "language": null,
    "preferences": null
  }
}
```
