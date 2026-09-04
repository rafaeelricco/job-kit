# Answer law

Every prefilled value comes from the Fact file named here. Read it; stop if
unreadable. Absent is absent — never infer, never answer from a prior draft or
memory. Never read story bodies.

| Value                                                                      | Read from                                                                                                                                                         |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| language level                                                             | `data/languages.yaml` `languages[].level` with `name`                                                                                                             |
| salary, notice, authorization, employment routes, relocation               | `data/candidate.yaml`                                                                                                                                             |
| remote / in-person, relocation, assessments, drug tests, background checks | `data/candidate.yaml` `work_preferences_from_resume`, then readable legacy keys                                                                                   |
| name, email, phone, site                                                   | `data/basics.yaml`                                                                                                                                                |
| LinkedIn, GitHub                                                           | `data/profiles.yaml`                                                                                                                                              |
| roles, employers, dates, work bullets, project depth                       | `data/experiences.yml`                                                                                                                                            |
| public portfolio projects                                                  | `data/projects.yml`                                                                                                                                               |
| skills / stack inventory                                                   | `data/skills.yaml`, then `data/skills-by-company.yml` when present                                                                                                |
| story claims and verified outcomes                                         | `data/stories/*.md` frontmatter only: `claim`, `evidence.*`, `impact_numbers` whose `verified` is not `unverified` and whose `kind` is `outcome`, and `never_say` |
| which CV to attach                                                         | `data/cvs.yaml` `adapt_per_vacancy` (absent → true) and `base` (filename under `cv/`)                                                                             |

## Resolution order

Every field takes the first rule that yields a value; the package prints the
rule as `source`. Nothing waits for the operator.

1. A Fact file above prints it → that file.
2. "Derived answers" below computes it → `derived`.
3. `data/candidate.yaml` `screening_defaults` prints it (`on_call`,
   `hours_overlap`, `timezone`, `referral_source`, `consent_to_data_processing`,
   `qa[]` as `question` / `answer` pairs matched on the label) → `data/candidate.yaml`.
4. The field wants composed prose → author it under `./contract-prose.md` → `authored`.
5. A required yes/no availability question — on-call, hours overlap, background
   check, assessment, start on notice — with nothing above → `Yes` → `default`.
6. Demographic or EEO → the option that declines to answer → `declined`;
   required with no such option → skip the posting.
7. Still nothing: optional → blank; required → skip the posting, reason
   `no answer for {label}`.

A dropdown or radio takes the option whose label matches the value; no match →
the option meaning other, not listed, or prefer not to say; none → rule 7.
Before staging any prose, enforce every `never_say` ban below.

## Derived answers

- Years of experience: floor(unique calendar months / 12) over every role's
  `date` in `data/experiences.yml`, the formula
  `job-pitch/references/contracts/contract-say.md` "The number firewall"
  prints. `N+ years?` is `Yes` iff the derived count ≥ N.
- First / last name: `basics.yaml` `name` split at the first space.
- City / state / country: `basics.yaml` `location` split on commas, last part
  the country; country of residence is that country.
- Earliest start date: today plus `availability.notice_period`; `Immediately`
  when the notice is zero.
- Referral source: the dossier's Provenance `source` mapped to the option that
  names that board (`linkedin-jobs` → LinkedIn, `work-at-a-startup` → Y
  Combinator, `weworkremotely` → We Work Remotely, `hiringcafe` → Hiring
  Cafe); no such option → `Job board` or `Other`; a free-text ask gets the
  board name. Never a person.
- Weekly hours: the posting's stated hours; full-time with none printed → 40.
- Seniority self-label: the current role's `position` in `data/experiences.yml`.
- Salary period: `salary_range_usd` is yearly. A monthly ask divides the
  figure by 12, rounded to 100; an hourly ask divides by 2080, rounded to 5.

- Language level is the printed self-assessment, paired with the language name. Never assert a certification, test score, or bare letter grade.
- Never name an employer's client. Use only a domain phrase already present in a Fact file.
- Remote, in-person, and relocation use `work_preferences_from_resume` verbatim. An empty key is no answer.
- Demographic and EEO questions are answered only by declining; never invent, recall, or read them from a file.
- Disqualifying questions get the truthful answer, even when it disqualifies.
- Every `never_say` entry is a run-global ban on outbound free-text, exact or semantically equivalent.
- A value no file prints and no rule derives follows the resolution order; never estimate one.
- Say a current-role gap out loud: `<skill> is real but predates my current role, treat it as secondary.`

## Salary expectation

Keep two bands separate:

- `ours` = `salary_expectations.salary_range_usd` (`ours.min`, `ours.max`), the accepted band, not the answer.
- `job` = USD figures printed by the posting (`job.min`, `job.max`); either may be absent.

If the posting prints figures in another currency, answer `job.max` in that
currency (`job.min` when only it is printed) — never convert. If `ours` is
empty and the posting prints none, the field follows resolution rule 7.

Otherwise use the first matching row:

| #   | Condition                             | Figure                    |
| --- | ------------------------------------- | ------------------------- |
| 1   | no `job.min`, no `job.max`            | `ours.max`                |
| 2   | both printed, `job.min >= ours.max`   | `(job.min + job.max) / 2` |
| 3   | both printed                          | `job.max`                 |
| 4   | `job.min` only, `job.min >= ours.max` | `job.min`                 |
| 5   | `job.min` only                        | `ours.max`                |
| 6   | `job.max` only                        | `job.max`                 |

Rows 2 and 4 meet an outpaying posting; never substitute an `ours` number for a `job`
operand. One-figure asks use the figure. Range asks use that figure as high and `job.min`
as low when printed and no higher than high, otherwise high. No posted number uses the
stored range.

Before staging, check the result is `>= job.min` and `<= job.max` wherever those bounds
exist. A failure means the wrong operand was read: name the row and broken bound, and
the field follows resolution rule 7.

A midpoint of `ours` answers no row.

## Sponsorship and authorization

Classify the question before answering. Match the asked jurisdiction in
`legal_authorization.jurisdictions[]` by code or clear synonym (`us`, `eu`, `uk`, `br`).
No matching row means no answer exists.

- Authorization, legally allowed, or permit → `work_authorization` or `legally_allowed_to_work`, verbatim.
- Requires visa → `requires_visa`, verbatim.
- Requires sponsorship → `requires_sponsorship`, verbatim.
- Working remotely or engagement model → `employment_routes`.

If no jurisdictions list exists, read only the legacy keys for the asked jurisdiction:

| Jurisdiction | Legacy keys                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| US           | `us_work_authorization`, `legally_allowed_to_work_in_us`, `requires_us_visa`, `requires_us_sponsorship`                 |
| EU           | `eu_work_authorization`, `legally_allowed_to_work_in_eu`, `requires_eu_visa`, `requires_eu_sponsorship`                 |
| Canada       | `canada_work_authorization`, `legally_allowed_to_work_in_canada`, `requires_canada_visa`, `requires_canada_sponsorship` |
| UK           | `uk_work_authorization`, `legally_allowed_to_work_in_uk`, `requires_uk_visa`, `requires_uk_sponsorship`                 |

Missing or empty keys mean no answer (resolution rule 7). Never answer one jurisdiction from another. A
binary question gets the literal truthful value. Never answer `No` to sponsorship just
because EOR exists. Put nuance in a free-text notes field once. Do not volunteer
sponsorship need to an engagement-only question. If possession versus need is ambiguous,
use the more specific field; never blend them into a hedge.
