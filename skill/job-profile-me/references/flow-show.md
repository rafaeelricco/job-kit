# Show

Read-only. `show` and `gaps` never write. `refresh-card` is the only card write.

## Read set (all under Profile root)

| Path                                                    | Supplies                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `data/job_search.yaml`                                  | work_model, seniority_level, job_types, date_posted, positions, `keywords.*`, locations                           |
| `data/candidate.yaml`                                   | salary_range_usd, notice_period, `legal_authorization.*`, `employment_routes.*`, `work_preferences_from_resume.*` |
| `data/skills.yaml`, `experiences.yml`, `languages.yaml` | card                                                                                                              |
| `data/profile_card.yaml`                                | card, when present — else derive in memory                                                                        |
| `data/search_packs.yaml`                                | deck: pack ids, `entry`, `enabled`, tokens — one pack is one board                                                |

Glob `data/*.{yaml,yml}`. A missing optional file is a blank field, never a stop.
An unreadable file → stop and name it.

## Blocks

Print `### Profile card`, then `### Constraints` — same field vocabulary as
job-scout Phase 0, so the two never disagree:

- Profile card: primary role · seniority · top skills · industries · languages · target stack
- Constraints: work model · seniority level · job types · positions · keywords · locations ·
  date_posted · salary_range_usd · work auth · employment_routes · relocation

`### Packs` third when `data/search_packs.yaml` is readable: `id · entry host ·
enabled|disabled · tokens`. Absent → one line saying job-scout will use the kit
fallback deck; never print the fallback's contents as if they were the profile's.

Unknown value = `—`, never invented. Card field source rules: full per-field
table in `./schema-profile-card.md` (single SSOT — load it here too, not only
for `refresh-card`). Cache present → its non-empty fields win except
`primary_role`/`seniority`/`target_stack`, always re-derived from current
`job_search.yaml` since `set` does not touch `profile_card.yaml`.

Say which: `card: profile_card.yaml`, `card: derived`, or `card: hybrid`
(cache present but at least one always-derived field came from facts).

## Gaps

Print **only** these — this skill's own Gaps allowlist:

- `salary_expectations.salary_range_usd`
- `availability.notice_period`
- `legal_authorization.*` when empty
- `employment_routes.employer_of_record`
- `job_search` `positions` / `keywords` when empty

`keywords` counts as a gap only when **no** group holds a non-empty list. Groups are
named by the operator and expand as `[skill:<group>]` tokens, so a profile with
`ai` and `backend` but no `primary` is complete — do not nag for any single
group name.

Never Gaps: remote / in-person prefs (`in_person_work*`),
`direct_contractor`, `local_employment`, empty `projects.yml` / `languages.yaml` /
experience `url.*`, `job_search.locations`, CV. Nothing outstanding → `Gaps: none`.

Shipped template defaults count as empty, not as answers: any keyword value
`TODO-skill`. Name it as unset.
