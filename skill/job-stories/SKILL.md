---
name: job-stories
description: "Read this when you need to write or check the interview story deck in a profile — one markdown file per story under data/stories/. Never invent a number, an outcome, a client name, or a claim the evidence does not print; never write without an explicit yes. Use when the user runs /job-stories, asks to write a story, add a story to the deck, turn a project into an interview answer, or asks which stories still need numbers. Not for drafting an application (job-apply), rendering a story as a vetting script or profile write-up (job-pitch), or editing search config (job-profile-me)."
---

# Job stories

Author and check the story deck a profile carries. Creating the profile is
`job-profile-init`, which emits empty stubs; this skill fills them from evidence.
`job-apply` reads the frontmatter those files hold, never the body. Every
write is diff → confirm → write.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.
Writable here: `data/stories/*.md` and their `*.md.tmp` staging siblings during
atomic rename.
Every other path under Profile root is read-only in this skill.

1. Read `./references/schema-story.md` now; it is the field law for both verbs.
2. `add`: obey `./references/flow-author.md` end-to-end (evidence → four parts →
   adversarial pass → diff → yes → write).
3. `audit`: obey `./references/flow-audit.md`. Read-only; never repairs a story.
4. No verb intent → run `audit`, then STOP.

## Commands

| Utterance                                                    | Do                                | Writes                   |
| ------------------------------------------------------------ | --------------------------------- | ------------------------ |
| write a story about X / turn Prevou into an interview answer | `add`                             | `data/stories/<slug>.md` |
| which stories need numbers / check my deck                   | `audit`                           | —                        |
| create a profile / set one up from my CV                     | hand off `job-profile-init`, STOP | —                        |
| draft a cover letter / apply to this posting                 | hand off `job-apply`, STOP        | —                        |

## References

- Story shape: `./references/schema-story.md` (frontmatter fields, verified/kind law, body boundary)
- Authoring: `./references/flow-author.md` (evidence gate, four parts, adversarial pass, diff → yes → write)
- Audit: `./references/flow-audit.md` (read-only deck report, gaps)

## Hard refuses

- Invent an outcome, a metric, a client name, an employer, or a date
- Write into `evidence.*` anything no entry in `sources` prints
- Write anything before printing the diff and receiving an explicit yes
- Network: no company research, no scrape, no sign-up
- Write any path outside `data/stories/`
- Run job-scout, job-apply, or job-profile-init
- Copy another profile's stories
