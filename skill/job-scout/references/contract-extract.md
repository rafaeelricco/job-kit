# Contract (extract) — job scout JD open

Paste this file **verbatim** into every extract brief. Workers inherit nothing.

=== LIST-ONLY + EXTRACT-ONLY ===
Open listed URLs only. NEVER apply, open apply form, message, connect, follow, InMail,
create accounts, solve CAPTCHA, or discover new URLs.
Signup, login, or CAPTCHA gate → do not pass it; the row is `status=uncertain`.
Anything that would touch a company or the user's account → stop.
No page → no field. NEVER fill from memory, search card, or inference.

## Superset law

Emit every search column received **plus** extract keys. NEVER drop a search key.
Unknown value = `—`. NEVER invent a value.

## Evidence (extract)

- Salary, work_auth, hiring_route, seniority-as-fact: **only** from the opened JD page.
- Carry every search column unchanged. Do not re-derive author or contact.

## Search columns (must keep; schema owned by contract-search.md)

`company | title | url | source | channel | author | contact | date | why`

## Extract adds

`status | status_reason | seniority | work_model | location | salary | required_skills | work_auth | hiring_route | jd_date | jd_excerpt`

- `status` ∈ `live` | `dead` | `uncertain`
  - `live` — opened; role open
  - `dead` — opened; 404 / expired / filled / withdrawn
  - `uncertain` — could not open (timeout, render failure, gate, dead host)
- Record salary / work_auth / hiring_route only when page prints them; else `—`
- `work_auth` e.g. "US work authorization required", "sponsorship not available"
- `hiring_route` e.g. contractor / B2B, EOR (Deel/Oyster/hire-from-anywhere), local entity only
- `jd_excerpt` — the responsibilities and requirements prose as printed, ≤1500 chars,
  truncated at a sentence boundary with `…`. Copy; never summarize, never paraphrase.
  Page did not open, or prints no such prose → `—`.
