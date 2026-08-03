# surface-linkedin-jobs

=== SEARCH-ONLY ===
Surface: `linkedin_jobs`. Obey CONTRACT_SEARCH end-to-end — it carries the evidence rules,
the search procedure, the URL rules, and both output schemas.

## Inputs (caller pastes verbatim — do not summarize)

PROFILE_CARD · CONSTRAINTS · PACK · CONTRACT_SEARCH

## Surface deltas

1. Session must already be signed in as the LinkedIn `username` from `data/profiles.yaml` (Profile root). Not signed in → return zero
   candidates and log defect `auth_gate`. No retry workaround.
2. Read the card for company, title, url, date, and poster-if-named → `author`.
3. Location filters — profile default is not acceptable. For each formulation, cycle
   every CONSTRAINTS location the UI offers (set explicitly), including Remote when
   listed. If the UI multi-selects, batch them in one pass per formulation. Merge and
   dedupe URLs after the cycle. Never invent a location the UI does not offer.

## Required output

`### Candidates` then `### Defect log`, both exactly per CONTRACT_SEARCH.
