# Profile questionnaire

Ask every user-owned field before profile Approve.

## Fields

Ask identity, basics, every `candidate.yaml` key, every experience/project/
language/skill row, and every `job_search.yaml` key:

- work model, `seniority_level`, job types, date filters
- positions, keyword groups, locations

Ask each `search_packs.yaml` `packs[].enabled` flag.

Do not ask pack `entry` URLs, pack implementation metadata, derived
profile URLs, or kit-owned `salary_expectations.tip`. Do not collect
demographic/EEO data.

## Rules

Show source-derived values and template defaults as proposals. Every field needs
explicit `confirm`, `edit`, or `skip`; silence is re-asked. Typed defaults need
explicit `keep`.
Template bool maps (`work_model`, `job_types`, `date_posted`) are convenience
shells, not facts — require `keep` or `edit`; on `skip` write empty/`false`,
never retain shipped trues.
Never infer legal authorization or language levels.

Ask one seniority value and write it as `seniority_level`, for example `entry`,
`mid-level`, `senior`, or `director`.

After all fields, ask whether the user wants to add observations or details that
were not covered. Preserve the response in the observations buffer.
