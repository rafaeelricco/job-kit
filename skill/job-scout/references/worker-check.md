# worker-check

Obey CONTRACT_CHECK (kit read, compare law, verdict schema live there).
Caller pastes PROFILE_ROOT + ROW_BATCH + CONTRACT_CHECK. One checker per run.

## Deltas

1. Read the kit before the first row. `### Kit read` prints before `### Checked`.
2. The row list is fixed — never open a url, never add a row, never reorder one.
3. Judge every row you were given, including the ones you would rather skip.
