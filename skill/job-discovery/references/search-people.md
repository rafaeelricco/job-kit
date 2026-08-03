# search-people

=== SEARCH-ONLY ===
Contacts only — not jobs. Emit `### Contacts`, never `### Candidates`. Rows never enter extract.
Obey CONTRACT_WORKER end-to-end. Skip its CONSTRAINTS filter step: that one is job-rows only.

## Inputs (caller pastes verbatim — do not summarize)

PROFILE_CARD · CONSTRAINTS · PACK · CONTRACT_WORKER

## Surface deltas

1. Session must already be signed in as the LinkedIn `username` from `data/profiles.yaml` (Profile root). Not signed in → return zero
   contacts and log defect `auth_gate`. No retry workaround.
2. NEVER connect, follow, or message. Publicly posted profiles only.
3. Verify inline: report only a profile you actually opened; drop the rest. Cap 20 contacts.

## Required output

`### Contacts` then `### Defect log`, both exactly per CONTRACT_WORKER.
