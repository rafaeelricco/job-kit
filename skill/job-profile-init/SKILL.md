---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor private data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/` or `private/`. Materialize shells only from `./templates/`.
Do not copy job-scout or job-application skill trees into the profile.

1. Read `./intake.md` now; ask one free-text question at a time in that order
   (identity + source of truth).
2. On confirm of identity summary, obey `./emit-tree.md` end-to-end
   (write → rewrite tokens → leak gate).
3. Unless the user chose **scaffold only** (intake Q7): read `./fill.md` now;
   obey it end-to-end (source gate → Fact fill → pack confirm → CV place →
   post-fill leak gate → gap report). Missing or unreadable SoT → STOP and
   follow up; do not invent; do not claim a filled profile. Scaffold-only →
   skip fill; state the profile is shells-only.
4. Print `./next-steps.md` (with remaining gaps filled into the template slots;
   or shells-only residual for scaffold-only), then offer
   `bash scripts/install.sh -y` inside the new target. STOP.

## References

- Intake: `./intake.md` (questions, defaults, stop rules)
- Emit tree: `./emit-tree.md` (tree map, tokens, leak gate)
- Fill: `./fill.md` (SoT gate, invent matrix, field map, packs, CV, gaps)
- Next steps: `./next-steps.md` (post-fill residual gaps + install)
- Templates: `./templates/` (only allowed shell source tree; never live donor data)

## Hard refuses

- Invent salary, visa, sponsorship, EOR, relocation, employers, skills, or numbers
- Network scrape / session harvest of LinkedIn (user-handed export **file** is OK as SoT)
- Fill or invent under `private/**`
- Generate a CV PDF or LaTeX
- Run job-scout or job-application
- Edit a non-empty or donor profile
