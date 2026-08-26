# MatchingPolicy

Workers do not invent criteria.

## Hard filters (pass / fail)

First match wins → blocked. Do not invent auth paths.

1–5. Drop when the posting cannot hire this seeker (first match): `listed` onsite or location-restricted place that matches no named `locations` (and `Anywhere` not listed); named onsite place with no shared work_model flag; remote bound to a country the kit has no authorization for; hire-from only in `exclude_locations`; salary currencies none of which are in `market_currencies`. Blank is not a drop. Never infer authorization or currency from a company or country name. Hire-from is printed location, `work_auth`, `hiring_route`, or a title country tag — never the company's country. Against `state.candidate.constraints` + JobProfile / Posting facts.

6. Explicit language requirement `state.candidate.languages` cannot meet
(printed must-have only; blank → not a block). Compare levels only when
posting and profile print the same scheme; cross-scheme or incomparable
tokens → unknown, not a block.

## Soft weights (sum = 100)

Cells are integers. Do not invent a scale beyond this table.
Round each scored cell to nearest integer (halves up) before the sum.
Let S = factors whose cell is not `—`. S empty → Gap that url, no score.
`match_score = round(100 × sum(points of S) / sum(weights of S))` (halves up).
`confidence = round(sum(weights of S) / 100, 2)`.

| Criterion         | Weight | Points                                                                                                                                                                                               |
| ----------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary stack     |     25 | `25 × \|∩\| / \|required_skills\|` (direct hold); either list empty → —                                                                                                                              |
| Experience        |     20 | Job token with no integer → —; else min N = first integer (`6+ years`→6, `8-10 years`→8, `12+`→12); candidate ≥ N → 20; short → 10; candidate `null` or job `null` → —                               |
| Seniority         |     15 | Same printed token as JobProfile `seniority` in `experience[].position` → 15; one step on intern–junior–mid–senior–staff–principal → 8; posting token not on that ladder → —; else 0. Job `null` → — |
| Role type         |     15 | JobProfile `title` contains a `candidate.roles[]` string (case-insensitive, punctuation ignored) → 15; else 0. `roles` empty → —                                                                     |
| Location / remote |     10 | Shared `work_model` and (remote or named-location match) → 10; shared `work_model` only → 5; else 0. Both unknown → —                                                                                |
| Domain            |      5 | Printed domain cue holds in `candidate.domains` → 5; cue present, no hold → 0; no cue → —                                                                                                            |
| Language          |      5 | Soft extra (not HF6) met → 5; printed extra unmet → 0; none → —                                                                                                                                      |
| Preferences       |      5 | `candidate.preferences` agree with JobProfile `work_model` / `location` → 5; conflict → 0; all blank → —                                                                                             |

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
