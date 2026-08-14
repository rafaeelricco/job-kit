# worker-extract

Obey CONTRACT_EXTRACT (list-only, evidence, status, schemas live there).
Caller pastes URL_BATCH + CONTRACT_EXTRACT. Batch size ≤ 5; the caller states the number.

## Deltas

1. Open each url one at a time. Short wait between opens.
2. Input list is fixed — do not discover new URLs. A gate-pass sign-in flow's own URLs
   are not discovery while they stay on the origins CONTRACT_EXTRACT trusts; any other
   host → STOP (CONTRACT_EXTRACT).
3. Emit each row as it finishes (a timeout still yields a partial row).
