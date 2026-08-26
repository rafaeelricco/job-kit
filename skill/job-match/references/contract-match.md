# MatchingPolicy

Workers do not invent criteria.

## Hard filters (pass / fail)

First match wins → blocked. Reuse scout gate vocabulary; do not invent auth paths.

1. `listed` onsite or location-restricted place that matches no named
   `locations` (and `Anywhere` not listed).
2. Named onsite place with no shared `work_model` flag in Constraints.
3. Remote bound to a country the kit has no authorization for
   (`candidate.yaml` legal_authorization / employment_routes as scout uses).
4. Hire-from only in `exclude_locations`.
5. Salary currencies none of which are in `market_currencies`.
6. Explicit language requirement the profile `languages.yaml` cannot meet
   (printed must-have only; blank → not a block). Compare levels only when
   posting and profile print the same scheme; cross-scheme or incomparable
   tokens (e.g. `fluent` vs `C1`) → unknown, not a block.

Blank is not a drop. Never infer authorization or currency from a company name.

## Soft weights (sum = 100)

Cells are integers. Do not invent a scale beyond this table.
Round each scored cell to nearest integer (halves up) before the sum.
After renormalization, round `match_score` the same way.

| Criterion         | Weight | Points                                                                                                                                                      |
| ----------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary stack     |     25 | `25 × \|∩\| / \|required_skills\|` (direct hold, not adjacent); either list empty → —                                                                       |
| Experience        |     20 | Floored years from Experience `date` vs posting `years_experience`: meet or exceed → 20; short → 10; posting blank → —                                      |
| Seniority         |     15 | Same printed token as posting `seniority` in card / recent titles → 15; one step on intern–junior–mid–senior–staff–principal → 8; else 0. Posting blank → — |
| Role type         |     15 | Posting title matches a Constraints `positions[]` entry (synonym OK) → 15; else 0. `positions[]` empty → —                                                  |
| Location / remote |     10 | Shared `work_model` and (remote or named-location match) → 10; shared `work_model` only → 5; else 0. Both unknown → —                                       |
| Domain            |      5 | Printed domain cue holds in card `industries` → 5; cue present, no hold → 0; no cue → —                                                                     |
| Language          |      5 | Soft extra (not HF6) met → 5; printed extra unmet → 0; none → —                                                                                             |
| Preferences       |      5 | `remote_work` / `in_person_work` / `open_to_relocation` agree with posting `work_model` / location → 5; conflict → 0; all blank → —                         |

No evidence for a factor → that factor contributes `—` (omit from sum, renormalize
over scored factors). Never write `0` for unknown.

## Decision bands

| match_score | decision        |
| ----------: | --------------- |
|      90–100 | excellent_match |
|       80–89 | strong_match    |
|       70–79 | possible_match  |
|       50–69 | weak_match      |
|         <50 | skip            |

## Skill hold

Direct only: `React.js` covers `React`; Vue does not. Never adjacent transfer here.
