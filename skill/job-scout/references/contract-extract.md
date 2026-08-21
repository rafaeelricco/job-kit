# Contract (extract) — job scout JD open

Paste this file **verbatim** into every extract brief. Workers inherit nothing.

=== LIST-ONLY + EXTRACT-ONLY ===
Open listed URLs only. NEVER apply, open an application form, message, connect,
follow, InMail, or discover new URLs.
Obey CONTRACT_BROWSE for page access and gates.
Still blocked after the operator's pass → row `status=uncertain`.
No page → no field. NEVER fill from memory, search card, or inference.

## Superset law

Emit every search column received **plus** extract keys. NEVER drop a search key.
Unknown value = `—`. NEVER invent a value.

## Evidence (extract)

- Salary, work_auth, hiring_route, seniority-as-fact, required_skills, work_model, location: **only** from the opened JD page.
- Carry every search column unchanged. Do not re-derive author or contact.

## Output section

Emit rows under `### Verified`.

## Search columns (must keep)

`company | title | url | source | channel | author | contact | date | why`

## Extract adds

`status | status_reason | seniority | work_model | location | salary | required_skills | work_auth | hiring_route | jd_date | jd_excerpt`

- `status` ∈ `live` | `dead` | `uncertain`
  - `live` — opened; role open
  - `dead` — opened; 404 / expired / filled / withdrawn
  - `uncertain` — could not open (timeout, render failure, gate, dead host)
- `work_model` — remote / hybrid / onsite as printed; comma-join when the page
  prints more than one (`hybrid, remote`). "Remote — US" is remote plus a
  `location` label, not onsite.
- `location` — city, country, region, timezone, or remote geography as printed
  ("Remote — US", "LATAM", "worldwide"). Copy a presence wall as printed
  ("must be based in CA"); never rewrite `Remote — US` into one. Never put
  legal-right phrasing here.
- `work_auth` — legal right to work only: "US work authorization required", "must be
  authorized to work in the US", "US citizenship required", "visa sponsorship not
  available", "US Person", "ITAR". Never put "Remote — US" or a city here. Else `—`.
- `hiring_route` e.g. contractor / B2B, EOR (Deel/Oyster/hire-from-anywhere), local entity only
- `required_skills` — comma-separated skill, tool, language, and product names the
  opened page prints as required (Requirements / Qualifications / Must have /
  You have / Required skills). Copy the printed names; never paraphrase.
  A Requirements (or equivalent) section present → tokens from that section, not
  from responsibilities-only mentions. No such section → tools the posting names
  as must-have in that prose. Include every printed required name even when it is
  absent from the profile. Years, English, hours, job type, and soft skills
  (communication, passion) are not this field.
  NEVER restrict to a closed bag or vocabulary. NEVER intersect with profile `C`
  at extract. NEVER drop a printed required name because it is not a programming
  language.
- `jd_excerpt` — the responsibilities and requirements prose as printed, ≤1500 chars,
  truncated at a sentence boundary with `…`. Copy; never summarize, never paraphrase.
  Page did not open, or prints no such prose → `—`.
