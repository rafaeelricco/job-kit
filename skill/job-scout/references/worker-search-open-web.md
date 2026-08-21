# worker-search-open-web

Caller supplies CONTRACT_BROWSE + CONTRACT_SEARCH before this surface delta.

## Deltas

1. Start from pack `entry` — one URL, one host. Dry → log; a runtime gate on that
   host → public-first, then pass the gate per CONTRACT_SEARCH step 1; still blocked
   → zero candidates, pack verdict `auth_gate`.
2. Prefer channels `direct_email` / `dm_request` / `founder` over pure ATS when printed.
3. Pack `entry` host as `site:` only for that host. ATS hosts with no browsable
   global index (`job-boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`):
   `site:` only — never open the root. A query surface (a search engine such as
   `google.com/search`) is never a `site:` host — run the formulation as a plain search.
4. `work-at-a-startup`: company card is intermediate; `url` must be the role page.
5. Geo UI (modes: CONTRACT_SEARCH step 4). Listed mode: if a location control
   exists, set/cycle named CONSTRAINTS locations (incl. Remote when listed); if
   no control, OR-suffix named locations into the query. Never invent locations.
