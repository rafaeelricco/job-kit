---
name: job-stories
description: "Read this when you need to write or check the interview story deck in a profile — one markdown file per story under data/stories/, from evidence the operator names. Use when the user runs /job-stories, asks to write a story, add a story to the deck, turn a project into an interview answer, or asks which stories still need numbers. Not for drafting an application (job-apply), rendering a story as a vetting script or profile write-up (job-pitch), or editing search config (job-profile-me)."
---

# Job stories

Fill Profile root `data/stories/` from evidence. Profile creation is
`job-profile-init` (empty stubs). Every write is diff → confirm → write.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.
Writable here: `data/stories/*.md` and their `*.md.tmp` staging siblings during
atomic rename. Every other path under Profile root is read-only in this skill.

1. Read `./references/schemas/schema-story.md` now; field law for both verbs.
2. `add`: obey `./references/flows/flow-author.md` end-to-end.
3. `audit`: obey `./references/flows/flow-audit.md`. Read-only; never repairs.
4. No verb intent → run `audit`.

## Commands

| Utterance                                                    | Do                                               | Writes                   |
| ------------------------------------------------------------ | ------------------------------------------------ | ------------------------ |
| write a story about X / turn Prevou into an interview answer | `add`                                            | `data/stories/<slug>.md` |
| which stories need numbers / check my deck                   | `audit`                                          | —                        |
| create a profile / set one up from my CV                     | hand off `job-profile-init`, then end this skill | —                        |
| apply to this posting / get an application ready             | hand off `job-apply`, then end this skill        | —                        |

## References

- Story shape: `./references/schemas/schema-story.md`
- Authoring: `./references/flows/flow-author.md`
- Audit: `./references/flows/flow-audit.md`

## Hard refuses

- Invent an outcome, a metric, a client name, an employer, or a date
- Write into `evidence.*` anything no entry in `sources` prints
- Write anything before printing the diff and receiving an explicit yes
- Network: no company research, no scrape, no sign-up
- Write any path outside `data/stories/`
- Run job-scout, job-apply, or job-profile-init
- Copy another profile's stories
