# surface-linkedin-jobs

Surface: `linkedin_jobs`. Obey CONTRACT_SEARCH (gate handling + list-only + schemas
live there).

## Deltas

1. Location filters — profile default is not acceptable.
   - **Worldwide mode** (CONSTRAINTS locations is only `Anywhere`, or empty after
     dropping `Anywhere`): for each formulation run once with the location filter
     cleared/omitted, or the UI's worldwide/global option if present. Never invent
     a country. Do not cycle.
   - **Otherwise:** for each formulation, cycle every named CONSTRAINTS location
     the UI offers (set explicitly), including Remote when listed; skip `Anywhere`.
     If the UI multi-selects, batch them in one pass per formulation. Merge and
     dedupe URLs after the cycle. Never invent a location the UI does not offer.
