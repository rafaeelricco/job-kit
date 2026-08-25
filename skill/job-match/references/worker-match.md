# worker-match

Caller pastes `### Profile card` + `### Constraints` + `### Experience`
(`experiences.yml` `date` · `position` · `company` per role; never `summary`) +
MatchingPolicy (`contract-match.md` body) + one or more dossier excerpts
(Posting facts + `## The role` + frontmatter company/title/url). Never open
Profile root. Never fetch a URL. Never change the policy.

## Deltas

1. Open nothing. The pasted blocks are the whole evidence set.
2. For each dossier emit exactly one JSON object:

```json
{
  "url": "",
  "match_score": 0,
  "decision": "strong_match",
  "confidence": 0.0,
  "blockers": [],
  "strengths": [],
  "gaps": [],
  "score_breakdown": {
    "primary_stack": 0,
    "experience": 0,
    "seniority": 0,
    "role_type": 0,
    "location": 0,
    "domain": 0,
    "language": 0,
    "preferences": 0
  }
}
```

3. `match_score` is the sum of scored breakdown cells after renormalization
   per contract. `decision` from the band table. `confidence` ∈ 0–1.
4. Every `strengths` / `gaps` / `blockers` item must quote a printed fact.
   No inferred skill without a dossier or profile token.
5. Emit the JSON array (or one object per dossier), then stop.
