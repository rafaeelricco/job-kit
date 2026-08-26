# worker-match

Caller pastes CandidateProfile JSON + MatchingPolicy (`contract-match.md` body)

- one or more JobProfile JSON objects. Never open Profile root. Never fetch a
  URL. Never change the policy. No dossier prose.

## Deltas

1. Open nothing. The pasted JSON and policy text are the whole evidence set.
2. For each JobProfile emit one MatchResult per `./schema-state.md`.
3. `match_score`, `decision`, `confidence` per contract. Unscored factor → JSON `null`.
4. Every `strengths` / `gaps` / `blockers` item quotes a token from the two JSON objects.
5. Emit the JSON array, then stop.
