# Job scout — gate

Every search and extract key present. Missing → Gaps, halt.

Drop when the posting cannot hire this seeker (first match): `listed` onsite or location-restricted place that matches no named `locations` (and `Anywhere` not listed); named onsite place with no shared work_model flag; remote bound to a country the kit has no authorization for; hire-from only in `exclude_locations`; salary currencies none of which are in `market_currencies`. Drop a `jd_date` older than the kit `date_posted` window (`24_hours` 1 day, `week` 7, `month` 31; `all_time` or none true → no bound): the search-time date keep saw the card, this sees the page. Blank is not a drop. Never infer authorization or currency from a company or country name. Hire-from is printed location, `work_auth`, `hiring_route`, or a title country tag — never the company's country.
