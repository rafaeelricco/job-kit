# worker-extract

Caller pastes one or more excerpts: dossier slice (Posting facts + `## The role` +
frontmatter `company` / `title` / `url` / `score`) or one supplied posting body
already in the brief. Never open Profile root. Never fetch a URL. Never score.

## Deltas

1. Open nothing. The pasted excerpts are the whole evidence set.
2. For each excerpt emit one JobProfile per `./schema-state.md`. Facts `—` → `null` / `[]`. A token not in the excerpt is absent.
3. Do not emit `match_score`, `decision`, `strengths`, `gaps`, or `blockers`.
4. Emit the JSON array, then stop.
