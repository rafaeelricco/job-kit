# Show

Read-only. `show` and `gaps` never write. `refresh-card` is the only card write.

## Read set (all under Profile root)

| Path | Supplies |
| --- | --- |
| `data/job_search.yaml` | work_model, experience_level, job_types, date_posted, positions, keywords.*, locations, blacklists, apply_once_at_company, distance_km |
| `data/candidate.yaml` | salary_range_usd, notice_period, legal_authorization.*, employment_routes.*, work_preferences_from_resume.*, home_market |
| `data/sources.yaml` | groups → rows (name, url, access) |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml`, `skills-by-company.yml` | card |
| `data/profile_card.yaml` | card, when present — else derive in memory |

Glob `data/*.{yaml,yml}`. A missing optional file is a blank field, never a stop.
An unreadable file → stop and name it.

## Blocks

Print `### Profile card`, then `### Constraints` — same field vocabulary as
job-scout Phase 0, so the two never disagree:

- Profile card: primary role · seniority · top skills · industries · languages · target stack
- Constraints: work model · experience level · job types · positions · keywords · locations ·
  blacklists · date_posted · salary_range_usd · work auth · employment_routes · relocation

`### Sources` third when `data/sources.yaml` is readable: one line per group in
file order, then `name — url (access)` rows.

Unknown value = `—`, never invented. `data/profile_card.yaml` present → its
non-empty fields win; derive only what it leaves empty. Say which:
`card: profile_card.yaml` or `card: derived`.

## Gaps

Print **only** these — the `job-profile-init` `fill.md` "Gaps allowlist only" set:

- `salary_expectations.salary_range_usd`
- `availability.notice_period`
- `legal_authorization.*` for `home_market` (no `home_market` on disk → say so; never pick one)
- `employment_routes.employer_of_record`
- `job_search` `positions` / `keywords` / `locations` when empty

`keywords` counts as a gap only when **no** group holds a non-empty list. Groups are
named by the operator and expand as `[skill:<group>]` tokens, so a profile with
`ai` and `backend` but no `primary` is complete — do not nag for a group name
`fill.md` happens to use as its example.

Never Gaps: screening binaries (`willing_to_*`, `in_person_work*`),
`direct_contractor`, `local_employment`, empty `projects.yml` / `languages.yaml` /
experience `url.*`, CV. Nothing outstanding → `Gaps: none`.

Shipped template defaults count as empty, not as answers: `positions:
["Software Engineer"]`, any keyword value `TODO-skill`, `locations: ["Remote"]`
alone. Name them as unset.
