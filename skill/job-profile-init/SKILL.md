---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor profile data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/`. Materialize shells only from `./templates/`.
Do not copy job-scout or job-application skill trees into the profile.
The only file this flow may write outside `<target>` is `~/.config/profile-root`,
and only via the target's `scripts/install.sh`.
Registering an existing profile is a valid outcome of this flow: it writes only
that pointer and skips emit and fill. It is not an edit of that profile.

Prefer the harness plan/approval workflow when one exists; otherwise ask in
normal messages and present the summary as one. Either way: nothing is written
until the user approves at intake item 8.

1. Read `./intake.md` now; ask one question at a time in that order
   (identity + source of truth). Registering an existing profile (intake Q1) is
   the whole intake — skip the remaining questions and go to step 4 with that
   path as `<target>`.
2. On approval of the identity summary, obey `./emit-tree.md` end-to-end
   (write → rewrite tokens → leak gate).
3. Unless the user chose **scaffold only** (intake Q7): read `./fill.md` now;
   obey it end-to-end (source gate → Fact fill → pack confirm → CV place →
   post-fill leak gate → gap report). Missing or unreadable SoT → STOP and
   follow up; do not invent; do not claim a filled profile. Scaffold-only →
   skip fill; state the profile is shells-only.
4. Register the profile: run `bash "<target>/scripts/install.sh"` (intake Q1
   absolute path, quoted). Exit 0 → state the profile is now the active profile
   root. Exit 2 → show the user the current registered path (from stderr) and
   ask whether to switch; yes → re-run with `--yes`; no → state the profile
   exists but is not the active root and print the switch command for later.
   Then print `./next-steps.md` (with remaining gaps filled into the template
   slots; or shells-only residual for scaffold-only). STOP.

## References

- Intake: `./intake.md` (questions, defaults, stop rules)
- Emit tree: `./emit-tree.md` (tree map, tokens, leak gate)
- Fill: `./fill.md` (SoT gate, invent matrix, field map, packs, CV, gaps)
- Next steps: `./next-steps.md` (post-fill residual gaps + install)
- Templates: `./templates/` (only allowed shell source tree; never live donor data)

## Hard refuses

- Invent salary, visa, sponsorship, EOR, relocation, employers, skills, or numbers
- Network scrape / session harvest of LinkedIn (user-handed export **file** is OK as SoT)
- Generate a CV PDF or LaTeX
- Run job-scout or job-application
- Edit a non-empty or donor profile
