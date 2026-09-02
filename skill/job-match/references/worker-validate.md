# worker-validate

Caller names the role and pastes only that role's input. Open nothing. Never
change the policy.

Shared output per `url`:

```json
{ "url": "", "verdict": "APPROVED", "reason": "", "match": null }
```

`verdict` ∈ `APPROVED` | `CORRECTION_REQUIRED`. `match` is `null` on APPROVED, a
full MatchResult on CORRECTION_REQUIRED.

## evidence

Input: CandidateProfile + JobProfile + MatchResult.
Every `strengths` / `gaps` / `blockers` item quotes a token from the two profiles.
Else CORRECTION (drop or rewrite the bullet; adjust breakdown if a claimed hold vanished).

## classify

Input: CandidateProfile + JobProfile + MatchResult + MatchingPolicy.
Must-have treated as preferred; seniority overstated; location / `work_model` misread;
printed must-have missing from JobProfile; a `0` cell where the evidence is
absent (`null` is the unknown value). Else APPROVED. Leave `match_score`,
`decision`, and `confidence` alone: the caller recomputes them.
