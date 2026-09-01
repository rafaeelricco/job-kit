# hiring.cafe — surface playbook

The `hiring-cafe` pack. `hiring.cafe` redirects to `hiringcafe.com`; run everything
on `hiringcafe.com` from page context via the browser (`js()` writing into a
`window` global, then poll — `await` inside `js()` hangs).

## No public API

`/api/search-jobs` answers `405` to POST and `401` to GET. The only working read is
the SSR payload: `GET /?searchState={json}&page={N}`, then parse
`#__NEXT_DATA__` → `props.pageProps`:

| key                  | meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `ssrHits`            | ~77 job objects per page                                                |
| `ssrTotalCount`      | total matches                                                           |
| `ssrIsLastPage`      | pagination stop                                                         |
| `initialSearchState` | JSON **string** — parse it before reading `searchQuery` for the echo    |

## searchState

```json
{ "searchQuery": "Senior Software Engineer",
  "locations": [{ "formatted_address": "United States", "types": ["country"],
    "geometry": { "location": { "lat": 37.0902, "lon": -95.7129 } },
    "id": "user_country",
    "address_components": [{ "long_name": "United States", "short_name": "US", "types": ["country"] }],
    "options": { "flexible_regions": ["anywhere_in_continent", "anywhere_in_world"] } }],
  "workplaceTypes": ["Remote"],
  "commitmentTypes": ["Full Time", "Contract"],
  "dateFetchedPastNDays": 7,
  "defaultToUserLocation": false }
```

`workplaceTypes` ∈ Remote | Hybrid | Onsite | Field.
`commitmentTypes` ∈ Full Time | Part Time | Contract | Internship | Temporary | Seasonal | Volunteer.
Omit `defaultToUserLocation: false` and the site silently geolocates the datacenter IP.

## dateFetchedPastNDays is not the publish date

It filters hiring.cafe's **crawl** date. With `=7`, only ~11% of hits were published
within 7 days; the rest run months old. Re-filter
`v5_processed_job_data.estimated_publish_date` in Python before applying the
`date_posted` keep rule, and drop `is_expired`.

## Job URL

`/job/{objectID}` 404s. Build the canonical path the app builds:
`slugify(title + " " + company + " " + location) + "-" + requisition_id`, where
location is `workplace_cities[0]`, else `formatted_workplace_location` split on
`" or "` and first two comma parts, else `"remote"` when the location is
blank/remote and `workplace_type` contains remote. Slug: NFKD, lowercase,
`&` → ` and `, non-alphanumerics → `-`, trim; truncate at 70 chars on the last `-`.

## Extract

Same SSR trick on the job page: `props.pageProps.job.job_information.description`
is the full JD as HTML — no expansion clicks needed.
`v5_processed_job_data` carries `language_requirements`, `workplace_countries`,
`listed_compensation_currency`, `yearly_*_compensation`, `visa_sponsorship`,
`position_employer_type`, `min_industry_and_role_yoe`, and `apply_url` sits on the
hit root. `technical_tools` is hiring.cafe's own summary — never use it as
`required_skills`; read the posting's requirements section.

## Cloudflare

More than ~6 rapid fetches returns `429` with a `Just a moment...` interstitial
(no `__NEXT_DATA__`). Pace JD fetches ~3.5 s apart, back off 20 s on a 429, retry 3×.
Search-page fetches tolerate a tighter loop.
