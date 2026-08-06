# surface-linkedin-jobs

Surface: `linkedin_jobs`. Obey CONTRACT_SEARCH (auth + list-only + schemas live there).

## Deltas

1. Location filters — profile default is not acceptable. For each formulation, cycle
   every CONSTRAINTS location the UI offers (set explicitly), including Remote when
   listed. If the UI multi-selects, batch them in one pass per formulation. Merge and
   dedupe URLs after the cycle. Never invent a location the UI does not offer.
