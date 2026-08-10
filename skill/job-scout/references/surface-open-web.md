# surface-open-web

Surface: open-web packs. Obey CONTRACT_SEARCH.

## Deltas

1. Start from pack `entry`. When entry names a `data/sources.yaml` group: sweep those
   rows; dry source → log; `access: account_required` or a runtime gate on that
   row’s host → public-first then log+skip into `sources_skipped` (not pack
   `auth_gate` unless every row is gated). Same as CONTRACT_SEARCH step 1 per-row.
2. Prefer channels `direct_email` / `dm_request` / `founder` over pure ATS when printed.
3. Row `url` host as `site:` only for that row’s host.
4. WaaS: company card is intermediate; `url` must be the role page.
5. Geo UI (modes: CONTRACT_SEARCH step 4). Named mode: if a location control
   exists, set/cycle named CONSTRAINTS locations (incl. Remote when listed); if
   no control, OR-suffix named locations into the query. Never invent locations.
