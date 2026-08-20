# Contract (search) — job scout search

Paste this file **verbatim** into every search brief. Workers inherit nothing.

=== LIST-ONLY ===
MUST report jobs. NEVER apply, open Easy Apply that posts, fill an application
form, message, connect, follow, InMail, or edit the profile repo — anything that
would, put under Gaps instead.
Obey CONTRACT_BROWSE for page access and gates.

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

1. Follow CONTRACT_BROWSE. A limited signed-out or guest result page is a
   gate even when some cards are visible — STOP and ask the operator to
   confirm login. A full public index (open-web) is not that gate.
   Still blocked, still guest, or the operator declines the gate →
   return zero candidates with verdict `auth_gate`.
   One pack is one host, so a gate that blocks it blocks the whole pack.
2. Interpolate pack tokens before searching: `[role]` = one term from CONSTRAINTS
   positions — submit the formulation once per position, in file order.
   `[skill:<group>]` = OR-join of that CONSTRAINTS keyword group;
   `[industry]` from PROFILE_CARD. Never leave a bracketed token in a submitted
   query. A token whose source list is empty or absent → drop the token and the
   parentheses that held it alone; a formulation left with no search term is not
   submitted and is logged as a dry run, never patched with an invented term.
   Do not repeat a keyword-group term as a literal when the same
   line already carries that group's `[skill:<group>]` token; curated narrow literals
   (a deliberate subset of a group, or terms in no group) are allowed.
3. Run every formulation in PACK, once per configured position. The walk lives
   inside one formulation and never changes `formulations_run`. Dry formulation =
   logged result, not a skip.
   Hit **pack-wide** `auth_gate` at (1) (shared surface only) → skip remaining
   SEARCH-ONLY steps for this pack;
   report the actual `formulations_run` with that verdict.
   A per-row skip is not pack-wide `auth_gate` and does not abort the pack.
4. **Geo coverage (job packs)** — do not accept the surface default geography.
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
5. **Proof the query ran.** Before you record anything for a submitted query —
   rows or zero — confirm the surface ran the string you submitted: the
   results view echoes it back (the search URL's query parameter, or the
   surface's own "results for …" element) and the echo is your string.
   Filling a search box is not submitting it. No echo, or an echo that is not
   your string → resubmit once by loading the surface's own search URL with
   the query percent-encoded. Still no echo → record zero rows for that
   query with verdict `defect: query_not_submitted`, naming the string that
   never landed.
6. **Job rows only** — apply CONSTRAINTS filters: work_model, seniority_level,
   job_types, date_posted.
   **Location keep (first match):**
   - card is remote / worldwide / anywhere / global (or hybrid with remote) → keep
   - CONSTRAINTS `locations` contains `Anywhere` → keep
   - card is onsite or location-restricted → keep only if it matches CONSTRAINTS
     `locations` (or a clear synonym: EU/Europe for listed EU countries)
   - location unknown on card → keep (main re-applies Location keep after extract)
     Outside other positive filters → not a candidate.
7. Normalize URLs per the rules above. Cap 40 candidates.
8. One call = one pack. Cards + URLs only.

## Output sections

Each unit prints `### Candidates` followed by `### Defect log` — every pack, no
exceptions, empty log included.

## Search Candidate (fixed columns, pipe table)

`company | title | url | source | channel | author | contact | date | why`

- `channel` ∈ `direct_email` | `dm_request` | `founder` | `ats`
- `author` = poster name + role when known; else `—`
- `contact` = public email or @handle when printed; else `—`
- Unknown value = `—`. NEVER omit a column. NEVER invent a value.

## Defect

`pack | formulations_run | zero_result_runs | verdict`

- `formulations_run` = formulations run for the pack. MUST equal the pack's
  formulation count or verdict names the defect.
- `zero_result_runs` = submitted queries that returned no rows.
- `verdict` ∈ `pass` | `auth_gate` | `defect: {name}`
  - `pass` — every formulation in the pack ran. A pack that ran clean and found
    nothing is still `pass`: emptiness is `zero_result_runs`, never a verdict.
  - `auth_gate` — step 1 left the surface signed-out, or the operator declined the
    gate. Zero candidates.
  - `defect: {name}` — anything else. `{name}` is a snake_case token naming the
    failure, e.g. `defect: query_not_submitted`.
- Never invent a fourth value. A pack you were not given has no row at all; main
  writes that row, not you.
