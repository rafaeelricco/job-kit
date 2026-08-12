# Contract (extract) — job scout JD open

Paste this file **verbatim** into every extract brief. Workers inherit nothing.

=== LIST-ONLY + EXTRACT-ONLY ===
Open listed URLs only. NEVER apply, open an application form, message, connect,
follow, InMail, or discover new URLs.
Gate blocks opening the listed JD → sign in, create a browse account, accept the
login/signup terms. A gate-pass buys the JD open, nothing else.
URLs the sign-in flow itself reaches (login page, identity provider, callback) belong to
that pass and are not URL discovery — but only while each hop stays on the listed URL's
registrable domain or on a known identity provider (Google, Microsoft, Apple, LinkedIn,
GitHub, Okta). Any other host → STOP and ask the operator once before going on; never
autofill identity or enter a secret there. Return to the listed URL when the pass completes.
Password, OTP, magic-link, or 2FA → STOP and ask the operator once; never invent
or persist a secret.
Signup identity fields (name, email, handle) come from the browser's saved autofill.
A field autofill cannot supply → STOP and ask the operator once; never invent one.
Still blocked after that pass → row `status=uncertain`.
Anything that would apply, message, or connect → stop.
No page → no field. NEVER fill from memory, search card, or inference.

## Superset law

Emit every search column received **plus** extract keys. NEVER drop a search key.
Unknown value = `—`. NEVER invent a value.

## Evidence (extract)

- Salary, work_auth, hiring_route, seniority-as-fact: **only** from the opened JD page.
- Carry every search column unchanged. Do not re-derive author or contact.

## Output section

Emit rows under `### Verified`.

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
