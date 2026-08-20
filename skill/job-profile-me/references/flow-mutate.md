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
    affected `### Constraints` (or `### Packs` / `### CVs`) slice.
11. On no (step 4): abort; say nothing was written.

Print `Profile root: /abs/path` before the first diff of the session.

## `job_search.yaml` — writable keys

| Key                                              | Shape                                                       |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `positions`                                      | list of strings                                             |
| `keywords.<group>`                               | list of strings; create a group only when the user names it |
| `locations`                                      | list of strings                                             |
| `work_model.*` / `job_types.*` / `date_posted.*` | bool, only when explicit                                    |
| `seniority_level`                                | string, only when explicit                                  |

Nothing else in this file is written. When scout Phase 0 (or the operator) names
a key still present in `job_search.yaml` that is not in the writable table above,
delete that key only — show the deletion in the same confirm cycle as any other
write. Never invent a replacement value for a deleted key. Deleting a pre-
`seniority_level` shape does not create `seniority_level`: ask for that value and
write it per the table when the operator wants it.

A `keywords` group name becomes a `[skill:<group>]` token job-scout packs expand.
Renaming or deleting a group a pack names leaves an un-expandable token — say so in
the same message as the diff; the user decides.

After a yes that writes `positions`, any `keywords.*`, or `seniority_level`: if
`data/profile_card.yaml` exists, also clear `primary_role`, `seniority`, and
`target_stack` in that file in the **same** confirm cycle (show them empty in the
diff). `show` already re-derives those three from `job_search.yaml`; clearing
keeps the cache from advertising stale values if read raw. Do not rewrite other
card fields; do not invent a full refresh — that is `refresh-card`.

## `search_packs.yaml` — writable

- `list` — read-only. File order: `id · entry host · enabled|disabled · tokens`.
- `enable` / `disable` — flip `enabled` on a named `id`. No id match → say so.
- `formulations` — replace the list on one pack with strings the user typed. Never
  compose a formulation, never widen one, never look a term up. Empty list → refuse.
  A typed line that contains `[skill:` or `[industry]` → warn (contract-search drops
  those tokens), then let the user decide.
- `add` / `remove` a pack — require `id`, `surface`, `entry`, and ≥1 formulation
  from the user. `surface` must match a `worker-search-<surface>.md` in the installed
  job-scout skill; unknown → refuse, name the valid ones. `entry` is one `http(s)`
  URL. A board is a pack, never a row inside one.

A `[skill:<group>]` token in a formulation whose group is absent from
`job_search.yaml` is dropped at search time — say so alongside the diff.

## `cvs.yaml` — writable keys

| Key             | Shape                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `default`       | one `id` that exists in `cvs`; never an id the file does not hold                                           |
| `cvs[].id`      | slug the operator names                                                                                     |
| `cvs[].file`    | filename under `cv/`; **must already exist and open as a PDF** — probe it before the diff, refuse otherwise |
| `cvs[].targets` | one prose line the operator typed; never composed, never widened                                            |

Nothing else in this file is written. `remove` of the row `default` names must set
`default` in the same confirm cycle — show both edits in one diff, and ask which id
takes over rather than choosing one. Removing the last row empties `cvs` and clears
`default`: say in the same message that job-apply falls back to `cv/en-us-resume.pdf`.

## Refuse (redirect, never write)

| Ask                                                                                    | Answer                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| salary, notice, visa, sponsorship, EOR, `legal_authorization.*`, `employment_routes.*` | Print what is on disk. Editing is `job-profile-init` blocker fill, or a human editing `data/candidate.yaml`. |
| experiences, skills, languages, projects, basics, profiles                             | Read-only here.                                                                                              |
| identity (LinkedIn username)                                                           | Read-only here.                                                                                              |
| "look up better keywords" / "find me boards"                                           | No network. Suggest only from files already on disk, labelled **suggestion**, and still diff → yes.          |

A suggestion is never a write. An unanswered suggestion stays a suggestion.
