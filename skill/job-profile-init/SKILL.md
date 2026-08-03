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

Prefer harness plan/approval when present; else normal messages. Nothing is
written until **Approve** (create path) or until install (register-only).

1. Read `./intake.md` now; run its named stages (**Route** → **Folder** →
   **Source** → **Identity** → **Approve**). **Register** ends intake: skip to
   step 4 with that path as `<target>` (zero Folder/Source/Identity/Approve).
2. On Approve: obey `./emit-tree.md` end-to-end (write → tokens → leak gate).
3. Unless **scaffold-only**: obey `./fill.md` end-to-end (SoT gate → Fact fill →
   pack confirm → CV place → post-fill leak gate → gap report). Missing or
   unreadable SoT → STOP; do not invent; do not claim a filled profile.
   Scaffold-only → skip fill; state shells-only.
4. Run `bash "<target>/scripts/install.sh"` (absolute path, quoted). Exit 0 →
   active profile root. Exit 2 → show current registered path from stderr; ask
   whether to switch; yes → re-run with `--yes`; no → leave inactive and print
   the switch command. Print `./next-steps.md` (remaining Gaps or shells-only
   residual). STOP.

## References

- Intake: `./intake.md` (named stages, defaults, stop rules)
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
