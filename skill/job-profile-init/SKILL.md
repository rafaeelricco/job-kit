---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor profile data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/`. Materialize shells only from `./templates/`.
Do not copy job-scout or job-application skill trees into the profile.
Outside `<target>`, write only Profile-root pointer files, and only via
**Activate** after operator **Yes** — algorithm: `./activate.md`. Activating an
existing profile (register-existing) is valid: pointer path only; no emit/fill;
not an edit of that profile.

Every invocation must enter **PLAN** mode before intake. Use the harness plan
workflow when available; otherwise read `plan-format`, present a read-only plan,
and wait for explicit approval. PLAN approval and profile **Approve** remain
separate gates.

1. After PLAN approval, read `./intake.md`; run its named stages (**Route** →
   **Folder** → **Activate ask + Source** (one turn, create path) →
   **Identity** → **Profile questionnaire** → **Approve**). **Register
   existing** ends intake after a standalone **Activate ask**: skip
   Folder/Source/Identity/Profile questionnaire/Approve; go to step 4 with that
   path as `<target>`. Intake's read-only pointer pre-discovery runs before
   Route so a switch is chosen up front, not after emit and fill.
2. On Approve: obey `./emit-tree.md` end-to-end (write → tokens → leak gate).
3. After Approve, obey `./fill.md` to apply the questionnaire buffer, write
   observations, place the CV, and run the leak/YAML gates. No post-approval
   field questions. SoT / invent / Gaps: `./fill.md` (Hard refuses bind).
   Scaffold-only may fill from questionnaire without a SoT; all-skip → shells-only.
4. **Activate** Profile root for absolute `<target>`, branching on the Activate
   ask. Exactly one bullet runs; none is nested under another.
   - **Yes** → obey `./activate.md` end-to-end. Then STOP.
   - **No**, and `<target>` equals `JOB_KIT_CONFIG` / host-default
     (path-convention probe without pointer) → STOP (this profile would
     auto-activate on emit despite the refusal). Re-run Activate ask.
   - **No**, otherwise → obey `./activate.md` for Activate-skipped handoff
     (next-steps only). STOP.

## References

- Intake: `./intake.md` (pointer pre-discovery, named stages, Activate ask, stop rules)
- Emit tree: `./emit-tree.md` (tree map, tokens, leak gate, unfilled inventory)
- Fill: `./fill.md` (SoT gate, invent matrix, field map, blocker fill, CV, gaps)
- Activate: `./activate.md` (dual-home pointers, rollback, KIT_INSTALL resolve)
- Next steps: `./next-steps.md` (Gaps + Activate note + adaptive kit install)
- Templates: `./templates/` (only allowed shell source tree; never live donor data)
- Questionnaire: `./questionnaire.md` (field scope and confirmation rules)

## Hard refuses

- Invent salary, visa, sponsorship, EOR, relocation, employers, skills, or numbers
- Network scrape / session harvest of LinkedIn (user-handed export **file** is OK as SoT)
- Generate a CV PDF or LaTeX
- Run job-scout or job-application
- Edit a non-empty or donor profile
- Run a profile's `scripts/install.sh` (legacy/stale; kit does not emit one)
