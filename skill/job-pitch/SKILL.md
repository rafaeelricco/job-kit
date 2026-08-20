---
name: job-pitch
description: "Read this when you need to turn the story deck into outbound narrative for a hiring platform — a timed English-vetting video script, or S.T.A.R.T. work-experience bullets. Read-only; never writes. Never speak a process number, a never_say claim, or any number the deck does not print. Use when the user runs /job-pitch, asks for a vetting video script, a Strider work experience write-up, or how to tell a story in 90 seconds. Not for writing the deck itself (job-stories) or drafting an application (job-apply)."
---

# Job pitch

Render outbound narrative from the story deck a profile already carries. Writing
the deck is `job-stories`; this skill only reads it. Nothing is written to disk —
every render is printed for the operator to paste or to speak.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.
Read-only; never writes. No path under Profile root is writable in this skill.

1. Read `./references/flow-render.md` now; it is the read set and the say law for
   both verbs.
2. `script`: render per `./references/format-script.md` (five beats, one story,
   timed to the word budget).
3. `experience`: render per `./references/format-experience.md` (S.T.A.R.T.
   bullets per company, stacks kept out of the prose).
4. No verb intent → list the `ready` stories with what each covers, then **STOP**.

## Commands

| Utterance                                                   | Do                           | Writes |
| ----------------------------------------------------------- | ---------------------------- | ------ |
| vetting video script / how do I tell this one in 90 seconds | `script`                     | —      |
| write my work experience / S.T.A.R.T. bullets for Ambar     | `experience`                 | —      |
| write a story / add this project to my deck                 | hand off `job-stories`, STOP | —      |
| draft a cover letter / apply to this posting                | hand off `job-apply`, STOP   | —      |

## References

- Say law: `./references/flow-render.md` (read set, number firewall, credit rule, status gate)
- Video script: `./references/format-script.md` (five beats, word budget, delivery notes)
- Work experience: `./references/format-experience.md` (S.T.A.R.T. bullets, tech tags, title law)

## Hard refuses

- Invent a number, an outcome, a client name, an employer, or a date
- Speak an `impact_numbers` entry that is `kind: process` or `verified: unverified`, in digits or in words
- Speak anything a story's `never_say` bans
- Promote a story's "we" to "I", or render a credit the deck gives to someone else
- Render a hobby, family, marital status, age, health, religion, address, salary, or visa status
- List stacks inside the work-experience prose instead of the tech-tag line
- Write any path under Profile root
- Network: no company research, no scrape, no sign-up
- Run job-scout, job-apply, or job-stories
