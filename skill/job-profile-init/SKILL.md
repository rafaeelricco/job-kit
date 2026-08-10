---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor profile data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/`. Materialize shells only from `./templates/`.
Do not copy job-scout or job-application skill trees into the profile.
Outside `<target>`, this flow may write only Profile-root **pointer files**
(host `~/.config/profile-root` and, when that tree already exists, Aside
`$HOST_HOME/.aside/runtime/home/.config/profile-root`), and only via **Activate**
after the operator's Yes. Host-default `$HOST_HOME/.config/job-kit` skips
pointer writes only in the pure path-convention case (no valid XDG profile
would outrank it). Write a durable pointer when Activate targets host-default
but `$XDG_CONFIG_HOME/job-kit` already passes the probe, or when Activate runs
inside Aside without host XDG visible — so claimed activation wins over a
higher-priority XDG convention path. XDG-only and other non-default targets
always get pointers. Never run a profile's `scripts/install.sh` — the kit no
longer emits one; only legacy trees still carry it, and it may be stale.
Session `export PROFILE_ROOT` is optional and not durable
for Aside. Activating an existing profile is a valid outcome: pointer writes
only (or host-default-location confirm), skip emit and fill. It is not an edit
of that profile.

Every invocation must enter **PLAN** mode before intake. Use the harness plan
workflow when available; otherwise read `plan-format`, present a read-only plan,
and wait for explicit approval. PLAN approval and profile **Approve** remain
separate gates.

1. After PLAN approval, read `./intake.md`; run its named stages (**Route** →
   **Folder** → **Activate ask** → **Source** → **Identity** → **Profile
   questionnaire** → **Approve**). **Register existing** ends intake after
   Activate ask: skip Folder/Source/Identity/Profile questionnaire/Approve; go
   to step 4 with that path as `<target>`. Intake's read-only
   pointer pre-discovery runs before Route so a switch is chosen up front,
   not discovered at (4.4) after emit and fill already wrote the tree.
2. On Approve: obey `./emit-tree.md` end-to-end (write → tokens → leak gate).
3. After Approve, obey `./fill.md` to apply the questionnaire buffer, write
   observations, place the CV, and run the leak/YAML gates. No post-approval
   field questions are allowed. Missing or unreadable SoT → STOP; do not
   invent; do not claim a filled profile. Scaffold-only may fill from direct
   questionnaire answers without a SoT; if every field is skipped, state
   shells-only.
4. **Activate** Profile root for absolute `<target>` only if Activate ask was
   **Yes**. If **No**:
   - If `<target>` equals `JOB_KIT_CONFIG` / host-default (path-convention
     probe without pointer) → **do not emit and do not stop as success**. Intake
     already forbids this; if reached here, STOP and re-run Activate ask or
     choose a non-default target. Never leave probe files under a path that
     auto-activates after an explicit refusal.
   - Else skip pointer writes (`./activate.md` 1–7); print `./next-steps.md`
     filled per `./activate.md` step 9 with Activate skipped; STOP.
     Do **not** run `"<target>/scripts/install.sh"`.
     If **Yes**: obey `./activate.md` end-to-end (dual-home write + mirror
     rollback + next-steps placeholders including KIT_INSTALL resolve). Then STOP.

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
