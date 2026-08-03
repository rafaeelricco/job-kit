# extract-jd

=== EXTRACT-ONLY ===
Obey CONTRACT_EXTRACT end-to-end — it carries the list-only guardrails, the status values,
the carry rule, the evidence rules, and the output schema.

## Inputs (caller pastes verbatim — do not summarize)

URL_BATCH (≤5 full Candidate rows) · CONTRACT_EXTRACT

## Procedure

1. Open each url one at a time. Short wait between opens.
2. Input list is fixed — do not discover new URLs.
3. Emit each row as it finishes (a timeout still yields a partial row).

## Required output

`### Verified` exactly per CONTRACT_EXTRACT (search columns + extract adds).
