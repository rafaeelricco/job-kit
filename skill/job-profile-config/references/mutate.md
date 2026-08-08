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
5. On yes: edit surgically. Never re-serialize the document, never drop comments or
   keys outside the diff. Then print `wrote <abs path>` and re-print only the affected
   `### Constraints` (or `### Sources`) slice.
6. On no: abort; say nothing was written.

Print `Profile root: /abs/path` before the first diff of the session.

## `job_search.yaml` — writable keys

| Key                                              | Shape                                                       |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `positions`                                      | list of strings                                             |
| `keywords.<group>`                               | list of strings; create a group only when the user names it |
| `locations`                                      | list of strings                                             |
| `work_model.*` / `job_types.*` / `date_posted.*` | bool, only when explicit                                    |
| `seniority_level`                                | string, only when explicit                                  |
| `apply_once_at_company`                          | bool, only when explicit                                    |

Nothing else in this file, with one delete-only exception: the keys this
revision dropped — `experience_level`, `company_blacklist`, `title_blacklist`,
`location_blacklist` — may be **removed**, never written or edited. Scout Phase 0
stops on a profile still carrying them, and this is the migration it names, so
refusing to touch them would leave the operator with no supported way to scout.
Removing `experience_level` does not supply `seniority_level`: ask for that value
and write it per the row above. Show every removal in the same diff and confirm
it like any other write.

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

- `list` — read-only. File order: `id · surface · enabled|disabled · tokens`.
- `enable` / `disable` — flip `enabled` on a named `id`. No id match → say so.
- `formulations` — replace the list on one pack with strings the user typed. Never
  compose a formulation, never widen one, never look a term up. `< 3` formulations
  → warn (contract-search requires ≥3), then let the user decide.
- `add` / `remove` a pack — require `id`, `impl`, `surface`, `entry`, and ≥3
  formulations from the user. `impl` must match a `surface-*.md` basename in the
  installed job-scout skill; unknown stem → refuse, name the valid stems.
- `max_parallel` / `extract_batch_size` — int, only when explicit.

A `[skill:<group>]` token in a formulation whose group is absent from
`job_search.yaml` is dropped at search time — say so alongside the diff.

## `sources.yaml` — writable

- `list` — read-only. Groups in file order, then `name — url (access)`.
- `add` — require `name` + `url` from the user. Optional: `why`, `access`
  (`public` | `account_optional` | `account_required`), `density`, `cadence`,
  `channels`, `notes`. Group defaults to `tier_2_aggregators`; any other group must
  already exist or be named by the user. Never invent a board, a URL, or a `why`.
- `remove` — match `name` case-insensitively. No match → say so, do not guess.
  Two matches → ask which.

`tier_1_high_alpha`, `tier_2_aggregators`, `baseline_floor` are named by job-scout
packs (`entry: from data/sources.yaml <group>`). Emptying or removing one leaves
those packs with no rows — warn alongside the diff, then let the user decide.

## Refuse (redirect, never write)

| Ask                                                                                    | Answer                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| salary, notice, visa, sponsorship, EOR, `legal_authorization.*`, `employment_routes.*` | Print what is on disk. Editing is `job-profile-init` blocker fill, or a human editing `data/candidate.yaml`. |
| experiences, skills, languages, projects, basics, profiles                             | Read-only here.                                                                                              |
| identity (`home_market`, LinkedIn username)                                            | Read-only here.                                                                                              |
| "look up better keywords" / "find me boards"                                           | No network. Suggest only from files already on disk, labelled **suggestion**, and still diff → yes.          |

A suggestion is never a write. An unanswered suggestion stays a suggestion.
