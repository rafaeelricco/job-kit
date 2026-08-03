# search-social

=== SEARCH-ONLY ===
Surfaces: `linkedin_posts`, `x`. Obey CONTRACT_WORKER end-to-end — it carries the evidence
rules, the search procedure, the URL rules, and both output schemas.

## Inputs (caller pastes verbatim — do not summarize)

PROFILE_CARD · CONSTRAINTS · PACK · CONTRACT_WORKER

## Surface deltas

1. When surface is `linkedin_*`: session must already be signed in as the LinkedIn `username` from `data/profiles.yaml` (Profile root).
   Not signed in → zero candidates + defect `auth_gate`. No retry workaround.
2. Read the poster as `author` (name + role when known). Printed email or @handle → `contact`.
3. A post without a separate JD URL is still a candidate; `url` = the post permalink.
4. On X: hard-filter junior / GTM / outsourcing spam. Prefer rows with `direct_email` or
   `dm_request` channel over pure noise.
5. English hiring posts: keep remote or strong-pay markets (USD/EUR/GBP, US, UK, Europe)
   in at least one formulation when CONSTRAINTS include them.

## Required output

`### Candidates` then `### Defect log`, both exactly per CONTRACT_WORKER.
