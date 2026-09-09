# Job scout — preflight

Print `Profile root:`, `Deck:` (`data/search_packs.yaml`), `Runtime: workers` if spawn works, else `inline`.

`job_search.yaml` keys: `work_model`, `job_types`, `date_posted`, `positions`, `locations`, `location_scope`, `direct_regions`, `market_currencies`, `exclude_locations`, `exclude_companies`. Any other valued key → stop; migrate via `/job-profile-me`.
`location_scope` is `worldwide` or `listed`. `listed` needs a named location (not only `Anywhere`).

Enabled packs empty and no URL token → STOP; enable via `/job-profile-me`. `enabled: false` is unlisted.
Tokens after `/job-scout` bind the run set (enabled deck `id:`). A token that
is an http(s) URL or bare domain binds an ad-hoc pack instead: `source` = its
host, `id` = its host (`-2`, `-3` on collision), `entry` = the URL (`https://`
assumed when bare), formulations = `[role]` — under every deck law (ATS-root,
filters, caps, defect log).
Empty → list as `N. {id}`; last line `{N+1}. Search in all`. Wait.
Any token → no wait. Run set: `all` → every enabled pack, else the named ids
(file order, unique), then each ad-hoc pack in token order; unique by `entry`.
Unknown `--` flag, leftover non-URL token, `all` plus a non-URL token, unknown id, or named disabled id → stop.
Skip-wait → print `Packs: {id}, …` in run order.

Print `### Profile card` (role · skills · industries · languages) and `### Constraints` (those keys plus salary_range_usd, work auth, employment_routes, relocation) — values per `job-profile-me` flow-show Blocks; scout adds no fields and prints no Packs/CV blocks. Pass both into every search.

Auth: existing session. Never create an account. Password/OTP/2FA are operator-only. Signed-out limited page → ask once only if the redirect stays on the target registrable domain or a known IdP (Google, Microsoft, Apple, LinkedIn, GitHub, Okta); any other host → STOP before asking. Still blocked → `auth_gate` (search) or `status=uncertain` (extract).
