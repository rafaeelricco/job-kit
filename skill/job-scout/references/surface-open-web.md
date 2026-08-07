# surface-open-web

Surface: open-web packs. Obey CONTRACT_SEARCH. No LinkedIn session required.

## Deltas

1. Start from pack `entry`. When entry names a `data/sources.yaml` group: sweep those
   rows; dry source → log; `access: account_required` → public-first then log+skip.
2. Prefer channels `direct_email` / `dm_request` / `founder` over pure ATS when printed.
3. Row `url` host as `site:` only for that row’s host.
4. WaaS: company card is intermediate; `url` must be the role page.
5. Geo:
   - **Worldwide mode** (CONSTRAINTS locations is only `Anywhere`, or empty after
     dropping `Anywhere`): leave location controls unset; do not OR-suffix any
     location into the query. One run per formulation.
   - **Otherwise:** if UI control exists, set/cycle named CONSTRAINTS locations
     (incl. Remote when listed; skip `Anywhere`). If no control, OR-suffix the
     named locations in the query. Never invent locations. Location blacklist
     still drops at Location keep (contract).
