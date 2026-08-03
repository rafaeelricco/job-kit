---
name: job-profile-init
description: "Scaffold a job-search profile and fill Fact-law data from a user-provided source of truth (CV, LinkedIn export file, notes). Never invent facts; never network-import LinkedIn; never copy donor profile data. Use when the user runs /job-profile-init, asks to scaffold a profile, create a profile for job skills, or set up job scout data for someone new."
---

# Job profile init

Create a **new** data-only profile checkout. Refuse non-empty targets. Never edit a
donor profile's `data/`. Materialize shells only from `./templates/`.
Do not copy job-scout or job-application skill trees into the profile.
The only file this flow may write outside `<target>` is `~/.config/profile-root`,
and only via the **Register** steps in this skill (never by executing the
profile's `scripts/install.sh` — that script may be missing or legacy).
Registering an existing profile is a valid outcome: it writes only that pointer
and skips emit and fill. It is not an edit of that profile.

Prefer harness plan/approval when present; else normal messages. Nothing is
written until **Approve** (create path) or until Register (register-only).

1. Read `./intake.md` now; run its named stages (**Route** → **Folder** →
   **Source** → **Identity** → **Approve**). **Register** ends intake: skip to
   step 4 with that path as `<target>` (zero Folder/Source/Identity/Approve).
2. On Approve: obey `./emit-tree.md` end-to-end (write → tokens → leak gate).
3. Unless **scaffold-only**: obey `./fill.md` end-to-end (SoT gate → Fact fill →
   pack confirm → CV place → post-fill leak gate → gap report). Missing or
   unreadable SoT → STOP; do not invent; do not claim a filled profile.
   Scaffold-only → skip fill; state shells-only.
4. **Register** absolute `<target>` as Profile root (agent-owned; do **not**
   run `"<target>/scripts/install.sh"`):
   1. `REPO="$(cd "<target>" && pwd -P)"` — STOP if not a directory.
   2. Require `"$REPO/data/candidate.yaml"` and `"$REPO/data/job_search.yaml"`;
      else STOP (same two-file probe as Route).
   3. If `~/.config/profile-root` exists, read the one-line path as `current`.
      If `current` is a directory, `current_canon="$(cd "$current" && pwd -P)"`;
      else `current_canon=""`.
      - `current_canon` equals `REPO` → state already registered; go to (5).
      - `current_canon` non-empty and not `REPO` → show `current_canon`; ask
        whether to switch to `REPO`. Yes → continue to (4). No → leave
        inactive; print later switch hint
        (`mkdir -p ~/.config && printf '%s\n' "$REPO" > ~/.config/profile-root`);
        go to (5).
   4. `mkdir -p ~/.config` and write exactly one line: canonical `REPO` into
      `~/.config/profile-root`. State registered (or switched from
      `current_canon`).
   5. Print `./next-steps.md` (remaining Gaps or shells-only residual). STOP.

   Profile `scripts/install.sh` remains for **manual** register/switch outside
   this skill; the skill never shells it.

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
