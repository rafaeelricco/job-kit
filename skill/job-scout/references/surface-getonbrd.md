# Surface — getonbrd (Get on Board)

Entry `https://www.getonbrd.com/jobs`. LATAM-focused board.

## DOM is unusable for search

The header search box (`#search_form` / `#search_term`) is a Stimulus controller
that navigates on submit. Neither `form.requestSubmit()`, a synthetic Enter, nor
CDP `Input.dispatchKeyEvent` fires it — the URL never changes and the page keeps
rendering the unfiltered homepage. `?q=`, `?search=`, `/jobs/search`, and
`/search` are all ignored or 404. Do not scan the rendered list.

## Route: public JSON API (no auth)

Run from page context with `js(...)`; plain `fetch`, no headers needed.

```
GET /api/v0/search/jobs?query={formulation}&per_page=40&page={n}&remote=true
```

- `meta.total_pages` drives pagination; `per_page` max observed 40–50.
- `remote=true` is the work_model filter. There is no date filter — read
  `attributes.published_at` (unix seconds) and apply `date_posted` yourself.
- `data[].links.public_url` is the canonical posting URL, but the **live page
  redirects to a category path** (`/jobs/programming/...`,
  `/jobs/machine-learning-ai/...`, `/empleos/programacion/...`). Open the URL and
  read `location.href` / `link[rel=canonical]` before normalizing, or the same job
  lands on a second dossier.
- `attributes.modality.data.id`: 1 Full time, 2 Part time, 3 Freelance,
  4 Internship. `attributes.seniority.data.id`: 1 no experience, 2 Junior,
  3 Semi Senior, 4 Senior, 5 Expert. Resolve names via `/api/v0/modalities` and
  `/api/v0/seniorities`.
- `GET /api/v0/jobs/{id}` and `/api/v0/jobs` return **401**; only the search and
  category endpoints are public. Company detail `/api/v0/companies/{id}` is public.
- `expand=` returns 500. Tags and company arrive as bare id refs.

## Extract

The API 401 means JD text must come from the page. Open the posting, force
`details` open, scroll to the end, read `document.body.innerText` — the whole JD
(functions, requirements, desirable, conditions, salary, and the tag list after
"Report this job") renders server-side, no truncation.

## Notes

- Salaries print as USD/month gross. Convert nothing; copy the printed string.
- "Requires applying in Spanish" appears near the title — that is HF6 evidence.
- Cross-listed jobs recur daily; most runs re-find existing dossiers and only
  bump `last_seen`.
