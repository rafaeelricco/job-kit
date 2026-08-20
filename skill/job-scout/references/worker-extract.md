# worker-extract

Caller pastes URL_BATCH + CONTRACT_BROWSE + CONTRACT_EXTRACT. Batch size ≤ 5;
the caller states the number.

## Deltas

1. Open each url one at a time. Short wait between opens.
2. Input list is fixed — do not discover new URLs. A gate-pass sign-in flow's own URLs
   are not discovery while they stay on the origins CONTRACT_BROWSE permits; any other
   host → STOP (CONTRACT_BROWSE).
3. Emit each row as it finishes (a timeout still yields a partial row).
