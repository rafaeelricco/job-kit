# Screening rules

Load only when the posting or live form asks a covered screening question. Read the
candidate files named by `prepare.md`; missing values surface instead of being inferred.
Demographic and EEO answers remain `operator`.

## Salary expectation

Keep two bands separate:

- `ours` = `salary_expectations.salary_range_usd` (`ours.min`, `ours.max`), the accepted band, not the answer.
- `job` = USD figures printed by the posting (`job.min`, `job.max`); either may be absent.

Apply `salary_expectations.tip` when present; never paste the tip into a form. The tip and
the table below state one rule. If they disagree, surface the conflict instead of choosing
between them. If `ours` is empty or the posting uses another currency, surface the value
instead of converting or comparing currencies.

Otherwise use the first matching row:

| # | Condition | Figure |
| --- | --- | --- |
| 1 | no `job.min`, no `job.max` | `ours.max` |
| 2 | both printed, `job.min >= ours.max` | `(job.min + job.max) / 2` |
| 3 | both printed | `job.max` |
| 4 | `job.min` only, `job.min >= ours.max` | `job.min` |
| 5 | `job.min` only | `ours.max` |
| 6 | `job.max` only | `job.max` |

Rows 2 and 4 meet an outpaying posting; never substitute an `ours` number for a `job`
operand. One-figure asks use the figure. Range asks use that figure as high and `job.min`
as low when printed and no higher than high, otherwise high. No posted number uses the
stored range.

Before staging, check the result is `>= job.min` and `<= job.max` wherever those bounds
exist. A failure means the wrong operand was read: stop, name the row and broken bound,
and stage nothing. The review prints the five-line derivation from `prepare.md`.

## Sponsorship and authorization

Classify the question before answering. Match the asked jurisdiction in
`legal_authorization.jurisdictions[]` by code or clear synonym (`us`, `eu`, `uk`, `br`).
No matching row means no answer exists.

- Authorization, legally allowed, or permit → `work_authorization` or `legally_allowed_to_work`, verbatim.
- Requires visa → `requires_visa`, verbatim.
- Requires sponsorship → `requires_sponsorship`, verbatim.
- Working remotely or engagement model → `employment_routes`.

If no jurisdictions list exists, read only the legacy keys for the asked jurisdiction:

| Jurisdiction | Legacy keys |
| --- | --- |
| US | `us_work_authorization`, `legally_allowed_to_work_in_us`, `requires_us_visa`, `requires_us_sponsorship` |
| EU | `eu_work_authorization`, `legally_allowed_to_work_in_eu`, `requires_eu_visa`, `requires_eu_sponsorship` |
| Canada | `canada_work_authorization`, `legally_allowed_to_work_in_canada`, `requires_canada_visa`, `requires_canada_sponsorship` |
| UK | `uk_work_authorization`, `legally_allowed_to_work_in_uk`, `requires_uk_visa`, `requires_uk_sponsorship` |

Missing or empty keys mean no answer. Never answer one jurisdiction from another. A
binary question gets the literal truthful value. Never answer `No` to sponsorship just
because EOR exists. Put nuance in a free-text notes field once. Do not volunteer
sponsorship need to an engagement-only question. If possession versus need is ambiguous,
use the more specific field and surface the ambiguity; never blend them into a hedge.

## Other screening

Answer notice, employment route, work location, relocation, assessments, drug tests, and
background checks from the exact candidate-file fields named in `prepare.md`. A stored
legacy answer remains readable and is never silently omitted. Surface every value that
the files do not print, including years of experience, weekly hours, or a seniority
self-label, rather than deciding alone.
