# Job scout — search

One pack at a time; never two on the same host.

Interpolate `[role]` from positions (file order), `[industry]` from the card.
Drop an empty leftover token. Build every formulation × position before opening
a surface.

`worldwide` → each formulation once, location unfiltered: location control unset, nonempty `locations` ignored for coverage. `listed` → cycle named `locations`. `Anywhere` is a keep token, never a query. A pack with `location: keep-only` runs under `listed` as under `worldwide`: each formulation once, location control unset, named `locations` applied at keep and gate only. Never infer keep-only from the surface; only the pack declares it. Any other present `location` value records `defect: query_not_submitted` and scans nothing, as an incomplete route does.

When a pack has `route`, consume it before any DOM search. Routed packs run once
per expanded formulation; location remains a keep filter instead of repeating
the same routed URL for every named location.

- Only `kind: json` is supported. Open `entry` to establish its browser origin,
  substitute the percent-encoded formulation and 1-based page into `url`, then
  GET that URL from page context.
- Resolve `items` and `pages` as dot paths in each JSON response. Resolve
  `posting_url` inside every item, normalize it, and retain the expanded
  formulation as `matched_query`. Populate standard candidate fields exposed by
  the item; absent fields remain `—` for posting-page extraction.
- Start at page 1 and stop at the configured total, when a page adds no new
  posting URL, or at the existing five-page and 40-candidate caps. Either cap as
  the reason for stopping → `defect: list_truncated`, as on a DOM run.
- A successful GET of the exact substituted URL is submission proof. An enabled
  `route_required: true` pack without a complete supported route, or any present
  incomplete route, records `defect: query_not_submitted` and scans nothing.
  HTTP failure, non-JSON output, or a missing configured response path records
  `defect: route_failed`. Never fall back to DOM after a configured or required
  route fails.

Without `route`, retain the DOM flow. Open `entry`. ATS roots with no browsable
index (`job-boards.greenhouse.io`, `boards.greenhouse.io`, `jobs.lever.co`,
`jobs.ashbyhq.com`) use `site:{entry host} {formulation}` on a search engine
instead; an `entry` with a path opens directly.

Surface filter controls matching Constraints `date_posted`, `work_model`,
`job_types`, and location (location omitted on a `location: keep-only` pack) — no others → set them before scanning. Paginate until
no next page or a page adds no new result URL, capped at five pages per
formulation run. A zero-keep page is not a stop. Cap hit →
`defect: list_truncated`.

For DOM runs, proof remains the surface echo matching the submitted string;
otherwise record `defect: query_not_submitted`.

Drop a card whose company slug (schema-dossier "Filename" rule) is in `exclude_companies`. Keep a card whose work_model intersects kit-true flags (unknown → keep) and that matches Constraints `job_types` and `date_posted`. Location keep (first match): `worldwide` → keep; `locations` contains `Anywhere` → keep; remote or hybrid-with-remote → keep; onsite or location-restricted → keep only if it matches named `locations` (synonym OK); location unknown → keep (gate re-applies after extract). Cap 40 per pack. Normalize URL per `job-store/references/schemas/schema-dossier.md`.

`channel` ∈ `direct_email` | `dm_request` | `founder` | `ats`. Unknown = `—`.

Every pack prints `### Candidates` then `### Defect log`:

`company | title | url | source | channel | author | contact | date | matched_query`

`pack | formulations_run | zero_result_runs | verdict`
`zero_result_runs` = runs that kept no card. A routed run is one expanded formulation, with location applied only as a keep filter. A DOM run is one expanded formulation, per named location under `listed`, or once under `worldwide` or on a `location: keep-only` pack. Every run zero-keep → `defect: zero_results`. For DOM runs under `listed`, every run for one named location zero-keep also → `defect: zero_results`; a `location: keep-only` pack has no per-location runs.
`verdict` ∈ `pass` | `auth_gate` | `defect: {name}`. No defect and no auth gate is `pass`.

## 2 Merge

One row per normalized URL. Prefer a named author. Channel sort: `direct_email` → `dm_request` → `founder` → `ats`.
