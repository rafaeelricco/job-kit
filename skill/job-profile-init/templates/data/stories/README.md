# stories/

One markdown file per story you would tell in an interview. `/job-profile-init`
creates empty stubs from the names you gave it; `/job-stories add` fills one from
evidence, and `/job-stories audit` reports what is still missing.

`job-apply`, `job-pitch`, and `job-resume-refine` read the **frontmatter
only**: `claim`, `evidence.*`, eligible `impact_numbers` entries (neither
`unverified` nor `kind: process`), and `never_say`. The body below the
frontmatter is rehearsal material and never reaches outbound text.

`never_say` is the negative list: claims banned from outbound text because a
reference check would break them. Each skill that drafts outbound text checks it
before printing, from the file and not from memory.

`README.md` and any file whose name starts with `_` are not stories.
