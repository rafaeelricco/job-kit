# worker-extract

Obey CONTRACT_EXTRACT (list-only, evidence, status, schemas live there).
Caller pastes URL_BATCH + CONTRACT_EXTRACT. Batch size ≤ `extract_batch_size`
from the deck the caller resolved (SSOT); the caller states the number.

## Deltas

1. Open each url one at a time. Short wait between opens.
2. Input list is fixed — do not discover new URLs.
3. Emit each row as it finishes (a timeout still yields a partial row).
