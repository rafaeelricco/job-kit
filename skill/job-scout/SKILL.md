---
name: job-scout
description: "Find and rank live job openings from operator-selected search packs or ad-hoc site URLs, report results, and persist scout dossiers. List-only: never applies or contacts. Not for dossier reading, applications, inbox triage, or profile configuration."
argument-hint: "[all | <pack-id>…] [<url>…]"
---

# Job scout

Profile: load `job-profile-me`'s read path — it obeys `job-profile-root`
end-to-end (a root STOP = no profile → STOP here) and owns the read set and
card derivation (`flow-show.md`, `schema-profile-card.md`). Never enter its
mutation flow. Resolve `data/*` against Profile root.
Refs: `./references/schema-dossier.md`, `./references/contract-persistence.md`, `./references/flow-match-gate.md`.
Surface playbook, load when its pack is in the run set: `./references/surface-hiring-cafe.md`.

List only. Never apply, message, or connect.
Write-set: `scout/jobs/*.md` + lock furniture per `contract-persistence.md`. Never `scout/runs/`.

## 0 Preflight

Print `Profile root:`, `Deck:` (`data/search_packs.yaml`), `Runtime: workers` if spawn works, else `inline`.

`job_search.yaml` keys: `work_model`, `job_types`, `date_posted`, `positions`, `locations`, `location_scope`, `direct_regions`, `market_currencies`, `exclude_locations`. Any other valued key → stop; migrate via `/job-profile-me`.
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

## 1 Search

One pack at a time; never two on the same host.

Open `entry`. ATS roots with no browsable index (`job-boards.greenhouse.io`, `boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`): never open the root — run `site:{entry host} {formulation}` on a search engine instead; an `entry` with a path is not a root, open it directly. Interpolate `[role]` from positions (file order), `[industry]` from the card. Drop an empty leftover token. Run every formulation × every position.

`worldwide` → each formulation once, location unfiltered: location control unset, nonempty `locations` ignored for coverage. `listed` → cycle named `locations`. `Anywhere` is a keep token, never a query.

Surface filter controls matching Constraints `date_posted`, `work_model`,
`job_types`, and location — no others → set them before scanning, location per
the scope rule above; the keep rules below still apply. Paginate every result
list until no next page or a page adds no new result URL, cap 5 pages per
formulation run. A zero-keep page is not a stop. Cap hit → `defect: list_truncated`.

Proof: surface echo is the submitted string, else `defect: query_not_submitted`.

Keep a card whose work_model intersects kit-true flags (unknown → keep) and that matches Constraints `job_types` and `date_posted`. Location keep (first match): `worldwide` → keep; `locations` contains `Anywhere` → keep; remote or hybrid-with-remote → keep; onsite or location-restricted → keep only if it matches named `locations` (synonym OK); location unknown → keep (gate re-applies after extract). Cap 40 per pack. Normalize URL per `schema-dossier.md`.

`channel` ∈ `direct_email` | `dm_request` | `founder` | `ats`. Unknown = `—`.

Every pack prints `### Candidates` then `### Defect log`:

`company | title | url | source | channel | author | contact | date | matched_query`

`pack | formulations_run | zero_result_runs | verdict`
`verdict` ∈ `pass` | `auth_gate` | `defect: {name}`. Empty and clean is `pass`.

## 2 Merge

One row per normalized URL. Prefer a named author. Channel sort: `direct_email` → `dm_request` → `founder` → `ats`.

## 3 Extract

Batches of 5, one URL at a time, same host serialized. Listed URLs only. No page → no field.

Open the full posting before copying: expand every collapsed or truncated
block ("read more" / "show more" / accordions) and scroll to the end. A JD
still truncated after expansion → `status=uncertain`, never partial facts.

`### Verified`: search columns plus schema Posting facts keys except `blocker`, and `status_reason`, `role_snapshot`, `role_do`, `role_must`.

`status` ∈ `live` | `dead` | `uncertain`. Copy printed names. `required_skills` from the requirements section; never a closed bag; never intersect the profile. Role cells per `schema-dossier.md`.

## 4 Gate

Every search and extract key present. Missing → Gaps, halt.

Drop when the posting cannot hire this seeker (first match): `listed` onsite or location-restricted place that matches no named `locations` (and `Anywhere` not listed); named onsite place with no shared work_model flag; remote bound to a country the kit has no authorization for; hire-from only in `exclude_locations`; salary currencies none of which are in `market_currencies`. Blank is not a drop. Never infer authorization or currency from a company or country name. Hire-from is printed location, `work_auth`, `hiring_route`, or a title country tag — never the company's country.

## 5 Rank + report

`score` 0–10 = the share of `required_skills` covered by `data/skills.yaml` `skills[].items`, 10 being all. Covered is direct, not adjacent — `React.js` covers `React`, Vue does not. Either list empty → unscored (`—`).

Bucket, first match — dossier frontmatter only, never chat: printed EOR route and kit EOR Yes → `EOR`; printed contractor/B2B and kit contractor Yes, or location matches `direct_regions` → `direct`; printed hire-from restriction → `restricted-geo`; else `unbucketed`.

Persist set = `./references/flow-match-gate.md`. Chat lists that set, score desc. No other sort.

`# Job Scout · {YYYY-MM-DD} · {n} live · {n} contacts · {n} defects`

- `live` = persist-set size
- `contacts` = public email or @handle on those rows
- `defects` = pack verdicts `defect: {name}` and `auth_gate`

Then each persist-set row:

`{score}  {company} — {title}`
`   {url}`

Then `{n} dossiers → {abs Profile root}/scout/jobs/`

`### Gaps` — skipped, tool defects, uncertain, kit drop, score≤7, match below bar, match blocked. Omit if empty.

## 6 Persist

Obey `schema-dossier.md` and `contract-persistence.md`. One dossier per persist-set row. No dossier for kit drop or uncertain. Existing dead dossier → closure log only.

STOP.
