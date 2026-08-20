# stories/

One markdown file per story you would tell in an interview. `/job-profile-init`
creates empty stubs from the names you gave it; `/job-stories add` fills one from
evidence, and `/job-stories audit` reports what is still missing.

`job-apply` reads the **frontmatter only**: `claim`, `evidence.*`, eligible
`impact_numbers` entries (neither `unverified` nor `kind: process`), and
`never_say`. The body below the frontmatter is rehearsal material and never
reaches a letter or a form field.

`never_say` is the negative list: claims banned from outbound text because a
reference check would break them. It is enforced at draft time against all
outbound free text, not by memory.

`README.md` and any file whose name starts with `_` are not stories.
