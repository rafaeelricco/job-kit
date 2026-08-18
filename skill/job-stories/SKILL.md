---
name: job-stories
description: "Read this when you need to write or check the interview story deck in a profile — one markdown file per story under data/stories/. Never invent a number, an outcome, a client name, or a claim the evidence does not print; never write without an explicit yes. Use when the user runs /job-stories, asks to write a story, add a story to the deck, turn a project into an interview answer, or asks which stories still need numbers. Not for drafting an application (job-apply) or editing search config (job-profile-me)."
---

# Job stories

Author and check the story deck a profile carries. Creating the profile is
`job-profile-init`, which emits empty stubs; this skill fills them from evidence.
`job-apply` reads the frontmatter those files hold, never the body. Every
write is diff → confirm → write.

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
