# Intake

One question at a time, in this order. Do not batch.

Where the harness offers structured choices, ask each enumerable question as
options — most likely first, labelled recommended — and always leave a
free-text escape. Where it does not, ask the same choices as a short numbered
list in one message. Never treat silence as an answer.

1. **Target path** — two ways to answer; offer both.
   - **Register an existing profile**: a directory holding both
     `data/candidate.yaml` and `data/job_search.yaml`, ignoring any path under a
     `templates/` directory. Look where the operator points and where the
     session already is; do not sweep the filesystem. Choosing one ends the
     intake: no emit, no fill, only the pointer write at step 4.
   - **Create new**: ask which parent directory the profile should live under.
     Seed that question with neutral signals only — the session working
     directory and its parent, plus the parent of any existing profile found.
     Assume no layout convention. Once the parent is known, propose names
     matching what that directory already uses; the operator may name it.
     Target must be absolute, and must not exist or be an empty directory. Test
     before offering — never offer one this law would refuse. Else STOP.
2. **Display name** → `data/basics.yaml` `name`.
3. **Email** (optional; `""` OK) → `basics.email`.
4. **LinkedIn username** (required, no `@`). Empty → STOP.
5. **GitHub username** (optional).
6. **Home market code** → `data/candidate.yaml` `home_market`. Free text, no
   default: the short country or region label job-scout uses to bucket and
   report openings. State the shape; recommend no value.
7. **Source of truth** — ask the mode first, then the payload. Modes: file
   path(s) (recommended), paste next, scaffold only.
   - File path(s): absolute path to CV / LinkedIn export PDF / notes. Accept
     multi-file (e.g. CV + preferences.md).
   - Paste next: the user pastes the source in the following message.
   - Scaffold only: emit + next-steps, **skip fill**, state the profile is
     shells-only. Offer it, but select it only on the user's own explicit intent.
     Empty, missing path, or unreadable → STOP with this follow-up (do not emit
     yet), then re-ask:
   > Need a source of truth (file path and/or paste). I will not invent salary,
   > visa, stack, or experience. Reply with path(s) or paste, then we continue.
8. Present the identity + SoT summary as the plan and wait for explicit
   approval — the harness approval step where one exists, otherwise an explicit
   yes in chat. Approval gates the first write; silence is not approval.
   Corrections → re-ask only the named fields and re-present. On approval →
   emit-tree (then fill, unless scaffold-only).
