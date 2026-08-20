---
name: job-profile-me
description: "Read this when you need to view or change an existing job-search profile without hand-editing YAML. Never create a profile, never run a search, never write without an explicit yes. Never invent salary, visa, sponsorship, EOR, employers, or numbers. Use when the user runs /job-profile-me, asks to show their profile or search config, change keywords / positions / locations, add or remove a job board, or asks what is missing for scout."
---

# Job profile me

Day-2 edits on a profile that already passes the probe. Creating a profile is
`job-profile-init`; running discovery is `job-scout`. No network of any kind.
Every mutation is diff → confirm → write; nothing is written before an explicit yes.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.
Writable here: `data/job_search.yaml`, `data/profile_card.yaml`,
`data/search_packs.yaml`, `data/cvs.yaml`, and their `*.yaml.tmp` staging siblings
during atomic rename.
Every other path under Profile root is read-only in this skill.

1. Read `./references/flow-show.md` now; obey it for `show` and `gaps`. Card
   derivation (cache absent or hybrid) also needs
   `./references/schema-profile-card.md` — load it then, not only for
   `refresh-card`.
2. Any mutation: obey `./references/flow-mutate.md` end-to-end (parse → diff → yes → write).
3. `refresh-card` writes the shape in `./references/schema-profile-card.md`.
4. No mutation intent → run `show`, then STOP.

## Commands

| Utterance                                                            | Do                                   | Writes                   |
| -------------------------------------------------------------------- | ------------------------------------ | ------------------------ |
| show my profile / profile card / what's my search config             | `show`                               | —                        |
| what's missing for scout                                             | `gaps`                               | —                        |
| change keywords / set positions / add location                       | `set`                                | `data/job_search.yaml`   |
| add a board / remove HiringCafe                                      | `packs add` / `packs remove`         | `data/search_packs.yaml` |
| refresh profile card from data                                       | `refresh-card`                       | `data/profile_card.yaml` |
| list my boards / list my packs / disable a pack / edit a formulation | `packs`                              | `data/search_packs.yaml` |
| list my CVs / which CV goes out by default                           | `cvs`                                | —                        |
| add a CV / remove a CV / set the default CV / retarget a CV          | `cvs add` / `cvs remove` / `cvs set` | `data/cvs.yaml`          |
| create a profile / set one up from my CV                             | hand off `job-profile-init`, STOP    | —                        |
| find jobs / scout openings                                           | hand off `job-scout`, STOP           | —                        |

## References

- Show: `./references/flow-show.md` (read set, card + constraints + packs + CVs blocks, gaps)
- Mutate: `./references/flow-mutate.md` (writable keys, diff → confirm → write, refuses)
- Card schema: `./references/schema-profile-card.md` (`profile_card.yaml` shape + derivation)

## Hard refuses

- Invent salary, notice, visa, sponsorship, EOR, employers, boards, skills, or numbers
- Write `data/candidate.yaml` or any Fact file (experiences, skills, languages, basics)
- Write anything before printing the diff and receiving an explicit yes
- Network: no board lookup, no keyword research, no scrape, no sign-up
- Run job-scout or job-apply; edit the kit fallback deck inside the job-scout
  skill (that copy is overwritten on reinstall — edit the profile deck instead)
- Copy another profile's data
- Register a CV whose file is not already present under `cv/`, or compile / generate any
  PDF or LaTeX. This skill names files the operator built; it never builds one.
