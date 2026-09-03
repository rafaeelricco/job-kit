# Profile questionnaire

Ask every user-owned field before profile Approve.

## Fields

Ask identity, basics, every `candidate.yaml` key, every experience/project/
language/skill/education row, and every `job_search.yaml` key:

- work model, job types, date filters
- positions, locations, `location_scope` (`worldwide` | `listed`),
  `direct_regions`, `market_currencies`, `exclude_locations`

Ask each `search_packs.yaml` `packs[].enabled` flag.

Ask CV policy after packs and before Stories:

- `adapt_per_vacancy`: **yes (Recommended)** | no. Yes → for each posting,
  job-resume-refine tailors roles, bullets, Skills, and the Summary from
  profile Facts and compiles a one-page PDF. No → the base CV
  goes out unchanged. Write `true`/`false`.

Then, only when adapt is yes and `cv/` holds no `.tex`: ask for an existing
`.tex` path to copy in as the base. Never generate LaTeX.

Do not ask pack `entry` URLs, pack implementation metadata, or derived
profile URLs. Do not collect demographic/EEO data.

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

## Stories

Ask after every other field and before observations.

Ask which moments the user would tell in an interview: one line each, a short
name and the employer or project it belongs to. Names only. Never ask for the
narrative, never draft one, never propose a moment the source of truth does not
print.

`skip` writes no stub and is never a Gap. Fill writes stubs for confirmed names.

Do not ask for `claim`, `evidence.*`, `impact_numbers`, `never_say`, or any
prose. Those need evidence this flow does not read; `/job-stories add` collects
them.

## Observations

Ask last. Ask whether the user wants to add observations or details that were
not covered. Preserve the response in the observations buffer.
