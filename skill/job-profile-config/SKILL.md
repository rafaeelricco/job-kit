---
name: job-profile-config
description: "Read this when you need to view or change an existing job-search profile without hand-editing YAML. Never create a profile, never run a search, never write without an explicit yes. Never invent salary, visa, sponsorship, EOR, employers, or numbers. Use when the user runs /job-profile-config, asks to show their profile or search config, change keywords / positions / locations, add or remove a job board, or asks what is missing for scout."
---

# Job profile config

Day-2 edits on a profile that already passes the probe. Creating a profile is
`job-profile-init`; running discovery is `job-scout`. No network of any kind.
Every mutation is diff → confirm → write; nothing is written before an explicit yes.

Profile root: resolve in order; print absolute path before any work; STOP if none.
<!-- mirror of job-scout SKILL.md resolve block (steps 1-5 verbatim) — keep in sync -->

**Probe** (must all pass for a candidate dir): directory exists and is readable;
contains `data/candidate.yaml` and `data/job_search.yaml`. Unreadable dir
(sandbox `Operation not permitted`, missing path) → treat as fail for that
candidate; try the next step. Do not invent a profile path.

1. `$PROFILE_ROOT` if set and probe passes.
2. File `$HOME/.config/profile-root` (one absolute path line); probe if non-empty.
3. **Aside dual-home pointer:** if `$HOME` is exactly or ends with
   `/.aside/runtime/home`, compute host `HOST_HOME` (strip suffix, else
   `$HOST_HOME` env if absolute) and read `$HOST_HOME/.config/profile-root`;
   probe when not already tried. Explicit Activate/install wins over path
   convention so a non-default active profile is not shadowed by residual
   files under the default config dir.
4. **Default config dirs** (probe each not already tried):
   - `JOB_KIT_CONFIG`: non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
     else `$HOME/.config/job-kit`.
   - **Host-default fallback:** `$HOST_HOME/.config/job-kit` where `HOST_HOME`
     is from step 3 when dual-home, else strip `/.aside/runtime/home` from
     `$HOME` or use `$HOME`. Probe when that path differs from `JOB_KIT_CONFIG`.
     Always probe host-default so a profile there stays resolvable across Aside
     (often no XDG) and coding agents (may set XDG elsewhere) without a pointer.
5. Walk session CWD upward until probe passes.
6. else STOP. Name each attempt (env, each pointer file + line, each default
   config path, walk start), then
   point at `job-profile-init` (**create new**, or **register existing** with
   Activate = Yes). Never scaffold a profile from here.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.
Writable here: `data/job_search.yaml`, `data/profile_card.yaml`,
`data/search_packs.yaml`, and their `*.yaml.tmp` staging siblings during atomic
rename.
Every other path under Profile root is read-only in this skill.

1. Read `./references/show.md` now; obey it for `show` and `gaps`. Card
   derivation (cache absent or hybrid) also needs
   `./references/profile-card-schema.md` — load it then, not only for
   `refresh-card`.
2. Any mutation: obey `./references/mutate.md` end-to-end (parse → diff → yes → write).
3. `refresh-card` writes the shape in `./references/profile-card-schema.md`.
4. No mutation intent → run `show`, then STOP.

## Commands

| Utterance                                                | Do                                | Writes                   |
| -------------------------------------------------------- | --------------------------------- | ------------------------ |
| show my profile / profile card / what's my search config | `show`                            | —                        |
| what's missing for scout                                 | `gaps`                            | —                        |
| list my boards                                           | `sources list`                    | —                        |
| change keywords / set positions / add location           | `set`                             | `data/job_search.yaml`   |
| add board / remove HiringCafe                            | `sources add` / `sources remove`  | `data/search_packs.yaml` |
| refresh profile card from data                           | `refresh-card`                    | `data/profile_card.yaml` |
| list my packs / disable a pack / edit a formulation      | `packs`                           | `data/search_packs.yaml` |
| create a profile / set one up from my CV                 | hand off `job-profile-init`, STOP | —                        |
| find jobs / scout openings                               | hand off `job-scout`, STOP        | —                        |

## References

- Show: `./references/show.md` (read set, card + constraints + sources blocks, gaps)
- Mutate: `./references/mutate.md` (writable keys, diff → confirm → write, refuses)
- Card schema: `./references/profile-card-schema.md` (`profile_card.yaml` shape + derivation)

## Hard refuses

- Invent salary, notice, visa, sponsorship, EOR, employers, boards, skills, or numbers
- Write `data/candidate.yaml` or any Fact file (experiences, skills, languages, basics)
- Write anything before printing the diff and receiving an explicit yes
- Network: no board lookup, no keyword research, no scrape, no sign-up
- Run job-scout or job-application; edit the kit fallback deck inside the job-scout
  skill (that copy is overwritten on reinstall — edit the profile deck instead)
- Copy another profile's data
