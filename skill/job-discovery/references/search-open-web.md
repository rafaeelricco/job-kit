# search-open-web

=== SEARCH-ONLY ===
Surfaces: `hn`, `waas`, `web_boards`. Obey CONTRACT_WORKER end-to-end — it carries the
evidence rules, the search procedure, the URL rules, and both output schemas.

## Inputs (caller pastes verbatim — do not summarize)

PROFILE_CARD · CONSTRAINTS · PACK · CONTRACT_WORKER · SOURCES when the pack names a group

## Surface deltas

1. No auth gate. Start from pack `entry`.
2. Source-group `entry` → sweep every row in order. Concrete URL → that URL only. Dry
   source still logs. `access: account_required` → public first; gated → log and skip.
   Never sign up.
3. Prefer `direct_email` / `dm_request` / `founder` over pure ATS.
4. Row `url` host may be a `site:` restriction — never a host the row lacks or from
   another group.
5. On `workatastartup.com`, company cards are intermediate only. Candidate `url` MUST be
   a role/job page — extract cannot discover child links from an index or company home.
6. Location — never leave profile/IP default geography.
   - Control present → set it from CONSTRAINTS locations (never invent UI values).
     Multi-select → batch available CONSTRAINTS markets in one pass per formulation.
     Single-select → cycle every available CONSTRAINTS location the UI offers
     (including Remote when listed); merge and dedupe URLs after the cycle.
   - No control → append one OR-clause from CONSTRAINTS locations (Remote + listed
     countries; Europe OK for listed EU).
   Never positive-geo a country listed in CONSTRAINTS `location_blacklist`.

## Required output

`### Candidates` then `### Defect log`, both exactly per CONTRACT_WORKER.
