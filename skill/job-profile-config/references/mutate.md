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

| Key | Shape |
| --- | --- |
| `positions` | list of strings |
| `keywords.<group>` | list of strings; create a group only when the user names it |
| `locations` | list of strings |
| `company_blacklist` / `title_blacklist` / `location_blacklist` | list of strings |
| `work_model.*` / `experience_level.*` / `job_types.*` / `date_posted.*` | bool, only when explicit |
| `apply_once_at_company` | bool, only when explicit |
| `distance_km` | int, only when explicit |

Nothing else in this file.

A `keywords` group name becomes a `[skill:<group>]` token job-scout packs expand.
Renaming or deleting a group a pack names leaves an un-expandable token — say so in
the same message as the diff; the user decides.

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

| Ask | Answer |
| --- | --- |
| salary, notice, visa, sponsorship, EOR, `legal_authorization.*`, `employment_routes.*` | Print what is on disk. Editing is `job-profile-init` blocker fill, or a human editing `data/candidate.yaml`. |
| experiences, skills, languages, projects, basics, profiles | Read-only here. |
| identity (`home_market`, LinkedIn username) | Read-only here. |
| "look up better keywords" / "find me boards" | No network. Suggest only from files already on disk, labelled **suggestion**, and still diff → yes. |

A suggestion is never a write. An unanswered suggestion stays a suggestion.
