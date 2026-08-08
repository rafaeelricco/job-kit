# Contract (search) — job scout search

Paste this file **verbatim** into every search brief. Workers inherit nothing.
Sibling skill `job-application` drafts. This pack never does.

=== LIST-ONLY ===
MUST report jobs or contacts. NEVER apply, open Easy Apply, fill forms, message,
connect, follow, InMail, create accounts, solve CAPTCHA, or edit the profile repo.
Anything that would touch a company or the user's account → stop; put it under Gaps.

## Evidence (search)

- No invent. No memory fill. No snippet-inferred salary/auth/route/seniority.
- Search may set light card fields only (company, title, url, date, poster if named).
- Contacts only if publicly printed. Never put personal data in a URL.
- **Forbidden on search/job rows:** salary, work_auth, hiring_route, seniority-as-fact
  (those stay `—` until extract opens the JD).

## URL normalize (emit + merge)

1. Lowercase host; strip trailing slash on path (except root).
2. Drop fragment (`#…`).
3. Drop query keys matching: `utm_*`, `li_*`, `ref`, `trk`, `trackingId`, `trkInfo`,
   `originalSubdomain`, `eBP`, `position`, `pageNum`, `refId` (and similar trackers)
   when path alone is unique.
4. Keep path. Keep job-id query keys only when path alone is non-unique (some ATS hosts).
5. One row per normalized URL.

## Search procedure (every search unit)

1. Login wall / paywall / signup / CAPTCHA → log the defect and move on.
   Never create an account. Never solve a CAPTCHA. Never retry around a gate.
2. **LinkedIn session (surfaces `linkedin_*` and pack id `people-ta`):** must already be
   signed in as LinkedIn `username` from `data/profiles.yaml` (Profile root). Fail →
   return zero candidates/contacts and defect `auth_gate`. No retry workaround.
   Other surfaces: no LinkedIn session required.
3. Interpolate pack tokens before searching: `[role]` = OR-join of CONSTRAINTS
   positions; `[skill:<group>]` = OR-join of that CONSTRAINTS keyword group;
   `[industry]` from PROFILE_CARD. Never leave a bracketed token in a submitted
   query. A token whose source list is empty or absent → drop the token and the
   parentheses that held it alone; a formulation left with no search term is not
   submitted and is logged as a dry run, never patched with an invented term.
   Do not repeat a keyword-group term as a literal when the same
   line already carries that group's `[skill:<group>]` token; curated narrow literals
   (a deliberate subset of a group, or terms in no group) are allowed.
4. Run every formulation in PACK (≥3). Dry formulation = logged result, not a skip.
   Already returned `auth_gate` at (2) → skip remaining SEARCH-ONLY steps for this pack;
   report actual `formulations_run` (usually 0) with that verdict.
5. **Geo coverage (job packs)** — do not accept the surface default geography.
   Cover CONSTRAINTS locations deliberately per surface file (LinkedIn location
   cycles; open-web set/cycle controls when present, else OR-suffix). Cap cycles as
   the surface file states. Never multiply packs by region.
   `Anywhere` is a keep-rule token, never a UI location or a query term — never
   submit it to a location control and never append it to a query.
   - **Named countries present** (any location that is not `Anywhere`,
     case-insensitive) → cycle those only; ignore `Anywhere` for geo coverage.
   - **Worldwide mode** — every entry is `Anywhere`, or the list is empty after
     dropping `Anywhere`: run each formulation **once** with geography unfiltered.
     LinkedIn: clear/omit the location filter, or select the UI's worldwide/global
     option if it offers one; never invent a country. Open-web: leave location
     controls unset and do not OR-suffix any location into the query.
6. **Job rows only** — apply CONSTRAINTS filters: work_model, seniority_level,
   job_types, date_posted.
   **Location keep (first match):**
   - card is remote / worldwide / anywhere / global (or hybrid with remote) → keep
   - CONSTRAINTS `locations` contains `Anywhere` → keep
   - card is onsite or location-restricted → keep only if it matches CONSTRAINTS
     `locations` (or a clear synonym: EU/Europe for listed EU countries)
   - location unknown on card → keep (main re-applies Location keep after extract)
     Outside other positive filters → not a candidate. People packs skip this step.
7. Normalize URLs per the rules above. Cap 40 candidates, or 20 contacts on a people pack.
8. One call = one surface × one pack. Cards + URLs only. Public contacts only.

## Search Candidate (fixed columns, pipe table)

`company | title | url | source | channel | author | contact | date | why`

- `channel` ∈ `direct_email` | `dm_request` | `founder` | `ats`
- `author` = poster name + role when known; else `—`
- `contact` = public email or @handle when printed; else `—`
- Unknown value = `—`. NEVER omit a column. NEVER invent a value.

## Contact (people pack only; never enters extract)

`name | role | company | profile_url | date_seen`

## Defect

`pack | formulations_run | row_runs | sources_hit | sources_skipped | zero_result_runs | verdict`

- `formulations_run` = formulations run per source row. MUST be ≥ 3 or verdict names the defect.
- `row_runs` = source rows swept. `1`, unless PACK `entry` names a source group: then every
  row in that group.
- Search operations = `formulations_run` × `row_runs`. NEVER report one without the other.
