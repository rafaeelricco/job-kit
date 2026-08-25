# Show

Read-only. `show` and `gaps` never write. `refresh-card` is the only card write.

## Read set (all under Profile root)

| Path                                                    | Supplies                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `data/job_search.yaml`                                  | work_model, job_types, date_posted, positions, locations, location_scope, direct_regions, market_currencies, exclude_locations |
| `data/candidate.yaml`                                   | salary_range_usd, notice_period, `legal_authorization.*`, `employment_routes.*`, `work_preferences_from_resume.*`              |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml` | card                                                                                                                           |
| `data/profile_card.yaml`                                | card, when present — else derive in memory                                                                                     |
| `data/search_packs.yaml`                                | deck: pack ids, `entry`, `enabled`, tokens — one pack is one board                                                             |
| `data/cvs.yaml`                                         | CV: `adapt_per_vacancy` (absent → true) and `base`                                                                             |

Glob `data/*.{yaml,yml}`. A missing optional file is a blank field, never a stop.
An unreadable file → stop and name it.

## Blocks

Print `### Profile card`, then `### Constraints` — same field vocabulary as
job-scout Phase 0, so the two never disagree:

- Profile card: primary role · top skills · industries · languages
- Constraints: work model · job types · positions · locations ·
  date_posted · location_scope · direct_regions · market_currencies · exclude_locations · salary_range_usd ·
  work auth · employment_routes · relocation

`### Packs` third when `data/search_packs.yaml` is readable: `id · entry host ·
enabled|disabled · tokens`. Absent → one line saying job-scout will STOP until
this file exists (emit via `/job-profile-init` or add packs via `/job-profile-me`).

`### CV` fourth when `data/cvs.yaml` is readable: `base`, plus `missing` when it
does not resolve under `cv/`, and `no latex` when its `.tex` sibling is absent —
a base pointing at nothing is the one CV state worth surfacing, and it prints
here, not as a Gap. Also print `adapt_per_vacancy: true|false` (absent → true).
Empty `base` → one line saying job-apply will attach `cv/en-us-resume.pdf`.

Unknown value = `—`, never invented. Card field source rules: full per-field
table in `./schema-profile-card.md` (single SSOT — load it here too, not only
for `refresh-card`). Cache present → its non-empty fields win except
`primary_role`, always re-derived from current
`job_search.yaml`.

Say which: `card: profile_card.yaml`, `card: derived`, or `card: hybrid`
(cache present but at least one always-derived field came from facts).

## Gaps

Print **only** these — this skill's own Gaps allowlist:

- `salary_expectations.salary_range_usd`
- `availability.notice_period`
- `legal_authorization.*` when empty
- `employment_routes.employer_of_record`
- `job_search` `positions` when empty
- `job_search` `location_scope` when empty; `locations` when `location_scope` is
  `listed` and the list is empty

Never Gaps: remote / in-person prefs (`in_person_work*`),
`direct_contractor`, `local_employment`, empty `projects.yml` / `languages.yaml` /
experience `url.*`, `job_search.locations` except the `listed`+empty pair above, CV.
Nothing outstanding → `Gaps: none`.
