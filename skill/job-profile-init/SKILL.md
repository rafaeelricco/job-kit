---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor profile data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets.
Materialize shells only from `./templates/`.
Outside `<target>`, write only Profile-root pointer files, and only via
**Activate** after operator **Yes**. Read-only until profile **Approve**.

1. Read `./references/flow-intake.md`; run its named stages (**Route** →
   **Folder** → **Activate ask + Source** (one turn, create path) →
   **Identity** → **Profile questionnaire** → **Approve**). **Register
   existing** ends intake after a standalone **Activate ask**: skip
   Folder/Source/Identity/Profile questionnaire/Approve; go to step 4 with that
   path as `<target>`. Pointer pre-discovery runs before Route.
2. On Approve: obey `./references/flow-emit-tree.md` end-to-end (write → tokens → leak gate).
3. After Approve, obey `./references/flow-fill.md`. No post-approval field questions.
4. **Activate** Profile root for absolute `<target>`, branching on the Activate
   ask. Exactly one bullet runs; none is nested under another.
   - **Yes** → obey `./references/flow-activate.md` end-to-end. Then STOP.
   - **No**, and `<target>` equals `JOB_KIT_CONFIG` / host-default
     (path-convention probe without pointer) → STOP (this profile would
     auto-activate on emit despite the refusal). Re-run Activate ask.
   - **No**, otherwise → obey `./references/flow-activate.md` for Activate-skipped handoff
     (next-steps only). STOP.

## References

- Intake: `./references/flow-intake.md`
- Emit tree: `./references/flow-emit-tree.md`
- Fill: `./references/flow-fill.md`
- Activate: `./references/flow-activate.md`
- Next steps: `./references/format-next-steps.md`
- Templates: `./templates/`
- Questionnaire: `./references/format-questionnaire.md`

## Hard refuses

- Invent salary, visa, sponsorship, EOR, relocation, employers, skills, or numbers
- Network scrape / session harvest of LinkedIn (user-handed export **file** is OK as SoT)
- Generate a CV PDF or LaTeX
- Run job-scout or job-apply
- Edit a non-empty or donor profile
- Run a **profile** `scripts/install.sh` (legacy/stale; kit does not emit one).
  Kit install is the checkout's `scripts/install.sh`, never under the profile.
