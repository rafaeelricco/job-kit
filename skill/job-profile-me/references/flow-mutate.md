# Mutate

One mutation per confirm cycle. Several related edits in one user message are one
batch — still one diff, one yes.

## Protocol

1. Parse intent → target file + key paths + new values. Ambiguous key → ask. Never guess a key.
2. Read the file. Parse fails → **STOP**; print the parser error and the path; write
   nothing. A broken file is repaired by a human, never overwritten.
3. Print the proposed change as a unified diff in a fenced `diff` block, anchored to
   `<file>:<line>`, showing only the lines that change.
4. Wait for an explicit **yes**. Silence, a question, or edits are not a yes. Edits →
   back to step 3 with the revision.
5. On yes: hold the exact pre-edit contents of every file this cycle touches —
   the target and, when the card-clear below fires, `data/profile_card.yaml`.
6. Render each file's edited content to a sibling `*.yaml.tmp` staging path.
   Edit surgically: never re-serialize the document, never drop comments or
   keys outside the diff. A live file is never edited in place.
7. Re-parse **every** staged file. Any staging write or parse that fails →
   delete the staged files and say nothing was written, naming the failing path
   and its error. No live file was touched, so there is nothing to undo — a full
   disk or a truncated write lands here, before the profile changes.
8. All staged files parse → rename each over its original. Rename is the only
   step that mutates a live file, and it allocates nothing, so the conditions
   that break a write cannot half-apply a cycle.
9. A rename that fails after an earlier one succeeded → restore those originals
   from the step-5 contents and report the cycle rolled back. Never print
   `wrote` for a cycle that did not complete: the card-clear and its
   `job_search.yaml` edit stand or fall together.
10. All renames done → print `wrote <abs path>` per file and re-print only the
    affected `### Constraints` (or `### Packs` / `### CV`) slice.
11. On no (step 4): abort; say nothing was written.

Print `Profile root: /abs/path` before the first diff of the session.

## `job_search.yaml` — writable keys

| Key                                              | Shape                                       |
| ------------------------------------------------ | ------------------------------------------- |
| `positions`                                      | list of strings                             |
| `locations`                                      | list of strings                             |
| `location_scope`                                 | `worldwide` \| `listed`, only when explicit |
| `direct_regions`                                 | list of strings                             |
| `market_currencies`                              | list of strings                             |
| `exclude_locations`                              | list of strings                             |
| `work_model.*` / `job_types.*` / `date_posted.*` | bool, only when explicit                    |

Nothing else in this file is written. When scout Phase 0 (or the operator) names
a key still present in `job_search.yaml` that is not in the writable table above,
delete that key only — show the deletion in the same confirm cycle as any other
write. Never invent a replacement value for a deleted key.

After a yes that writes `positions`: if
`data/profile_card.yaml` exists, also clear `primary_role`
in that file in the **same** confirm cycle (show it empty in the
diff). `show` already re-derives that from `job_search.yaml`; clearing
keeps the cache from advertising a stale value if read raw. Do not rewrite other
card fields; do not invent a full refresh — that is `refresh-card`.

## `search_packs.yaml` — writable

- `list` — read-only. File order: `id · entry host · enabled|disabled · tokens`.
- `enable` / `disable` — flip `enabled` on a named `id`. No id match → say so.
- `formulations` — replace the list on one pack with strings the user typed. Never
  compose a formulation, never widen one, never look a term up. Empty list → refuse.
  A typed line that contains `[industry]` → warn (scout drops an empty
  `[industry]` token), then let the user decide.
- `add` / `remove` a pack — require `id`, `surface`, `entry`, and ≥1 formulation
  from the user. `surface` is a label (`linkedin-jobs`, `open-web`, `social`, or
  another); scout opens `entry`, it does not load a playbook file. `entry` is one
  `http(s)` URL. A board is a pack, never a row inside one.

## `cvs.yaml` — writable keys

| Key                 | Rule                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `adapt_per_vacancy` | `true` or `false`; never a synonym. Absent today → writing `true` is an explicit keep                       |
| `base`              | filename under `cv/`; **must already exist and open as a PDF** — probe it before the diff, refuse otherwise |

Nothing else in this file is written. Clearing `base` → say in the same message
that job-apply falls back to `cv/en-us-resume.pdf`.

## Refuse (redirect, never write)

| Ask                                                                                    | Answer                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| salary, notice, visa, sponsorship, EOR, `legal_authorization.*`, `employment_routes.*` | Print what is on disk. Editing is `job-profile-init` blocker fill, or a human editing `data/candidate.yaml`. |
| experiences, skills, languages, projects, basics, profiles                             | Read-only here.                                                                                              |
| identity (LinkedIn username)                                                           | Read-only here.                                                                                              |
| "find me boards"                                                                       | No network. Suggest only from files already on disk, labelled **suggestion**, and still diff → yes.          |

A suggestion is never a write. An unanswered suggestion stays a suggestion.
