# Contract (search) — job scout search

Paste this file **verbatim** into every search brief. Workers inherit nothing.

=== LIST-ONLY ===
MUST report jobs. NEVER apply, open Easy Apply that posts, fill an application
form, message, connect, follow, InMail, or edit the profile repo — anything that
would, put under Gaps instead.
Gate blocks listing or opening a JD for extract → sign in, create a browse account,
accept the login/signup terms. A gate-pass buys listing and extract, nothing else.
Password, OTP, magic-link, or 2FA → STOP and ask the operator once; never invent a
secret; never write any secret into dossiers or the report.
The browser is the operator's own session — its cookies, logins, and autofill.
A page you could not open, click, or filter is not a searched page.
Signup identity fields (name, email, handle) come from the browser's saved autofill.
A field autofill cannot supply → STOP and ask the operator once; never invent one and
never fill it from memory.

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

1. Login wall / paywall / signup / a surface that answers signed-out → pass it
   per LIST-ONLY above. That pass buys listing; opening a JD for extract has its
   own pass in `contract-extract.md`. Resume after the operator supplies or
   completes a secret.
   Still blocked after that pass, or the operator declines to unblock it → failed
   gate:
   Return zero candidates, verdict `auth_gate`, and move on. One pack is one host,
   so a gate that blocks it blocks the whole pack.
2. Interpolate pack tokens before searching: `[role]` = one term from CONSTRAINTS
   positions; `[skill:<group>]` = one term from that CONSTRAINTS keyword group —
   which term is the term budget below; `[industry]` = one term from PROFILE_CARD
   industries. Never leave a bracketed token in a submitted
   query. A token whose source list is empty or absent → drop the token and the
   parentheses that held it alone; a formulation left with no search term is not
   submitted and is logged as a dry run, never patched with an invented term.
   Never submit `[skill:<group>]` or `[industry]`. If a formulation line contains
   either, drop those tokens and the spaces that held them before interpolate.
   A line left with no `[role]` and no remaining literal is dry.
   Never OR-join hiring literals on one line. One phrase per formulation; a
   wider net is a separate line (e.g. `hiring [role]`), not `(a OR b) [role]`.
   Do not repeat a keyword-group term as a literal when the same
   line already carries that group's `[skill:<group>]` token; curated narrow literals
   (a deliberate subset of a group, or terms in no group) are allowed.
   **Term budget — one term per submitted query.** A `[role]` or `[skill:<group>]`
   token carries exactly one term in any submitted query. Walk its source list in
   file order, one query per term, and stop after the sixth term. Two walked tokens
   on one line advance together — term 1 with term 1, term 2 with term 2, the shorter
   list cycling back to its first term — never the cross-product. Terms past the
   sixth are not searched: carry the count as `terms_unsearched`, never as a silent
   drop. A surface ranks a query, it does not evaluate it as a boolean set, so an
   OR-join of a list matches nothing and returns a zero that says nothing about the
   market. One term is what a person types into the box; one term is what you submit.
3. Run every formulation in PACK, each as the full query walk the term budget
   gives it. Dry formulation = logged result, not a skip.
   Two formulations that interpolate to the same submitted string are one query:
   submit it once. `formulations_run` still counts both — `queries_submitted` is
   where the collapse shows.
   **Zero yield — loosen the line, never the list.** A submitted query that returns
   no rows is a `zero_result_run`. Every query of a formulation zero → rerun that
   formulation's walk twice more, each pass dropping one restriction, before you
   record the zero:
   pass 1 — remove the rightmost token that is not `[role]`. `[role]` is what makes
   the row a job and never leaves the line.
   pass 2 — unquote every one-word term; quotes stay only on phrases of two words or
   more.
   A pass whose string was already submitted is not resubmitted. A line with nothing
   left to loosen skips straight to the record.
   Everything on a formulation line is ANDed by the surface: three exact phrases need
   all three in one post, and cutting terms out of a token cannot relieve that — only
   dropping a token or its quotes can.
   Every formulation of the pack zero after both passes, every query of it proven at
   (5) → verdict `defect: zero_yield`. A pack that matched nothing at any looseness is
   a search that did not work, not a market with no jobs.
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
5. **Proof the query ran.** Before you record anything for a submitted query — rows
   or zero — confirm the surface ran the string you submitted: the results view
   echoes it back (the search URL's query parameter, or the surface's own
   "results for …" element) and the echo is your string. Filling a search box is not
   submitting it; a typeahead can swallow the Enter and leave the previous query's
   results on screen, and that page's zero belongs to a query you never wrote. No
   echo, or an echo that is not your string → resubmit once by loading the surface's
   own search URL with the query percent-encoded. Still no echo → record zero rows
   for that query with verdict `defect: query_not_submitted`, naming the string that
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

`pack | formulations_run | queries_submitted | zero_result_runs | terms_unsearched | verdict`

- `formulations_run` = formulations run for the pack. MUST equal the pack's
  formulation count or verdict names the defect.
- `queries_submitted` = queries actually submitted across those formulations —
  every term of the walk and every loosening pass included, a collapsed duplicate
  counted once.
- `zero_result_runs` = submitted queries that returned no rows.
- `terms_unsearched` = terms left past the six-term walk, summed across the pack's
  tokens. `0` when every list fit.
