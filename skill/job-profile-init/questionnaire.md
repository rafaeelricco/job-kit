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
Ask which countries need stored answers, then ask the four authorization
answers once per country. Write each as one `legal_authorization.jurisdictions[]`
row (`country`, `work_authorization`, `legally_allowed_to_work`, `requires_visa`,
`requires_sponsorship`). Never copy one country's answers onto another. An empty
list means no stored answer for any jurisdiction.

Ask one seniority value and write it as `seniority_level`, for example `entry`,
`mid-level`, `senior`, or `director`.

## Stories

Ask after every other field and before observations.

Ask which moments the user would tell in an interview: one line each, a short
name and the employer or project it belongs to. Names only. Never ask for the
narrative, never draft one, never propose a moment the source of truth does not
print.

Each confirmed name becomes a `data/stories/<slug>.md` stub, `status: draft`,
every other field empty. `skip` writes no stub and is never a Gap.

Do not ask for `claim`, `evidence.*`, `impact_numbers`, `never_say`, or any
prose. Those need evidence this flow does not read; `/job-stories add` collects
them.

## Observations

Ask last. Ask whether the user wants to add observations or details that were
not covered. Preserve the response in the observations buffer.
