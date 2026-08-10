# Activate

1. `REPO="$(cd "<target>" && pwd -P)"` — STOP if not a directory.
2. Require `"$REPO/data/candidate.yaml"` and `"$REPO/data/job_search.yaml"`;
   else STOP (same two-file probe as Route). Create path: this runs **after**
   emit and apply the questionnaire (including scaffold-only) so probes exist.
3. Resolve `HOST_HOME`: if `$HOME` ends with `/.aside/runtime/home`, strip
   that suffix; else `HOST_HOME=$HOME`.
4. Resolve `HOST_DEFAULT=$HOST_HOME/.config/job-kit` and this-env
   `JOB_KIT_CONFIG` (non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
   else `HOST_DEFAULT`). Path-convention branch when `REPO` equals
   `HOST_DEFAULT` **and** this process is **not** inside Aside runtime (`$HOME`
   does not end with `/.aside/runtime/home`) **and** `JOB_KIT_CONFIG` either
   equals `HOST_DEFAULT` or fails the two-file probe. Host-default needs no
   pointer except the two exceptions in `../templates/README.md` (XDG
   outranks it, or activation ran inside Aside) — see the fall-through below.
   - **Do not write** a host/Aside pointer naming `REPO` in the pure-convention
     case.
   - **Do clear** shadowing registrations: read host
     `$HOST_HOME/.config/profile-root` and, when the runtime home exists,
     `$HOST_HOME/.aside/runtime/home/.config/profile-root`. Delete both
     together; if mirror removal fails after host delete, **restore** the host
     pointer.
   - Host or mirror line non-empty and resolves to a path other than `REPO`
     (or is unresolvable non-empty) → show that path; ask whether to switch to
     host-default `REPO`. Yes → delete host pointer and mirror; state switched;
     go to (8). No → leave inactive; print later Activate hint; go to (9).
   - No shadowing line (absent/empty, or already `REPO`) → remove any redundant
     pointer/mirror that names `REPO` itself; state host-default-location
     active; go to (8).
     **Fall through to (5)** (write pointers) when:
   - `REPO` is `$XDG_CONFIG_HOME/job-kit` and that path differs from
     `HOST_DEFAULT` (Aside often lacks XDG), or
   - `REPO` is `HOST_DEFAULT` but `JOB_KIT_CONFIG` differs **and** passes the
     two-file probe — a durable pointer is required so claimed activation
     outranks the valid XDG convention path (Activate already confirmed Yes;
     treat as intentional switch from that XDG profile), or
   - `REPO` is `HOST_DEFAULT` and this process is inside Aside runtime —
     host `$XDG_CONFIG_HOME` is not visible here; keep a durable pointer so a
     later host session with a probe-passing XDG profile does not re-outrank.
5. Host / Aside registration conflicts (when writing pointers — includes
   host-default fallthrough from (4)):
   - Read one-line `current` from host `$HOST_HOME/.config/profile-root` if
     the file exists.
   - If `current` is a directory, `current_canon="$(cd "$current" && pwd -P)"`;
     else `current_canon=""`.
   - Also read Aside runtime mirror when that file exists. If its line is
     non-empty and does not resolve to `REPO`, treat it as a conflict even
     when the host pointer is absent, empty, or already `REPO` — `job-scout`
     reads the mirror first; overwriting it is a switch.
   - `current_canon` equals `REPO` and no mirror conflict → if stored `current`
     differs from `REPO`, rewrite host to canonical `REPO`. Then run (7)
     **unconditionally** when the runtime home exists (mirror may be missing
     or stale). State already active; go to (9).
   - `current_canon` equals `REPO` but mirror names another path → show the
     mirror path; ask whether to switch. Yes → continue to (6)/(7). No → leave
     inactive; go to (9).
   - `current_canon` non-empty and not `REPO` → show `current_canon`; ask
     whether to switch to `REPO`. Yes → continue to (6). No → leave inactive;
     print later Activate hint; go to (9).
   - `current_canon` empty but `current` non-empty → the pointer names a path
     this process cannot traverse (e.g. a live profile under an Aside-blocked
     parent). Treat it as a conflict, **not** a free slot: show `current`, say
     it could not be resolved, ask the same switch question, same Yes/No
     handling.
   - Host pointer absent or empty, no mirror conflict, but `REPO` is
     host-default and this-env `JOB_KIT_CONFIG` differs and passes the probe →
     active XDG convention is a conflict; ask to switch (Activate Yes already
     covers the skill path).
   - Only an absent/empty host pointer **and** no mirror conflict **and** no
     XDG-convention conflict skips the switch ask.
6. `mkdir -p "$HOST_HOME/.config"` and write exactly one line: canonical
   `REPO` into `$HOST_HOME/.config/profile-root`.
7. If `$HOST_HOME/.aside/runtime/home` is a directory: `mkdir -p` its
   `.config` and write the same one-line `REPO` into
   `$HOST_HOME/.aside/runtime/home/.config/profile-root`. If runtime home
   missing, skip mirror; state skip. This is how Aside sandbox `$HOME` sees
   the pointer without inheriting coding-agent env.
   If the mirror write fails (read-only, full disk), **roll (6) back** —
   restore the host pointer's previous contents, or remove it when it did not
   exist — then STOP with the error. Never leave agents on the new profile
   while Aside still resolves the old one through a stale mirror.
8. Best-effort: `export PROFILE_ROOT="$REPO"` for this session (or harness
   equivalent). State whether export ran. **Aside will not see this export** —
   host-default path-convention probe + dual-home read + (otherwise) host
   pointer and runtime mirror cover Aside.
9. Print `./next-steps.md` with placeholders filled, then STOP:
   - `{{GAPS_LINE}}` — if the fill report has any scout-critical Gaps remaining,
     set to a single line:
     `- Resolve remaining Gaps from the fill report: <gap bullets or summary>.`
     If none (or register-existing wrote no tree): set to **empty** (omit the line).
     Remaining Gaps from the fill report include
     skipped **scout-critical** blockers (not optional/preference shells).
     **Scaffold-only: report the gaps the completed fill actually left**, and
     fall back to the `./emit-tree.md` unfilled inventory only for values still
     holding their placeholder. The questionnaire now confirms positions,
     keywords, locations, and blockers during the same run, so printing the
     whole inventory would claim resolved fields still read `TODO-skill`.
   - `{{ACTIVATE_NOTE}}` — if Activate ran: host-default-location active, **or**
     host path written + mirror yes/no (including XDG-only defaults); session
     export yes/no. If skipped: how to Activate later — re-run
     `/job-profile-init`, choose register-existing on `<target>`, answer Yes
     (mirrors Aside when runtime home exists).
   - `{{KIT_INSTALL}}` — **one** of the two blocks below (pick by resolve).
     Never print bare `bash scripts/agents/install.sh` or
     `bash scripts/aside/install.sh` without an absolute kit root or the
     README get-kit recipe. Operator is often only in a profile directory.
   - `{{CV_LINE}}` — if `"$REPO/cv/en-us-resume.pdf"` exists and is a non-empty
     file: set to **empty** (omit the line). Else set to:
     `- If CV not placed: add cv/en-us-resume.pdf before job-application attachments.`
     Register-existing: probe the same path under `<target>`.

   **Resolve `KIT_ROOT` (optional):** take the real path of this skill
   directory (`…/skill/job-profile-init`). Parent of `skill/` is a candidate
   kit root if both of these files exist:
   `$KIT_ROOT/scripts/agents/install.sh` and
   `$KIT_ROOT/scripts/aside/install.sh`. Symlink installs usually resolve;
   a copied skill with no kit tree does not — then treat as unresolved.

   **Probe install state (read-only; only when `KIT_ROOT` resolved).** A probe
   that cannot run reports _unknown_, never _installed_.

   - Agents: for each of `$HOST_HOME/{.claude,.agents,.grok}` that is a
     directory, compare bare `readlink "<home>/skills/job-profile-init"` (no
     `-f`, no `realpath` — mirrors `scripts/agents/lib.sh` `is_kit_skill_link`)
     against `$KIT_ROOT/skill/job-profile-init`. Installed = at least one match.
   - Aside: `ASIDE_ROOT="${ASIDE_SKILLS:-$HOST_HOME/.aside/u/${ASIDE_ACCOUNT:-0}/skills/builtin}"`.
     Installed = the single line of `$ASIDE_ROOT/job-scout/.job-kit` equals
     `$KIT_ROOT/skill/job-scout`, and the same holds for `job-application`.
   - **Never probe by directory existence.** Legacy `skills/user/job-apply` and
     `job-discovery` links from other repos are left in place by the installer
     on purpose and would false-positive.

   **If `KIT_ROOT` resolved** — set `{{KIT_INSTALL}}` from the probe. Print
   commands the operator actually needs, never a conditional they must evaluate:

   - Both channels installed → `Kit channels already installed from <KIT_ROOT>.
Nothing to run.`
   - Aside not installed → `Install scout/apply into Aside:
bash "<KIT_ROOT>/scripts/aside/install.sh"`
   - Agents probe matched no eligible home → `Link job-profile-init into your
agent homes: bash "<KIT_ROOT>/scripts/agents/install.sh"`
   - Agents probe matched some but not all eligible homes → name the homes that
     are missing it, then the same absolute command.
   - Any probe _unknown_ → print its command with the reason it could not be
     checked. Commands are absolute; CWD does not matter.

   **If unresolved** — probe Aside repo-agnostically first: `$ASIDE_ROOT/job-scout/.job-kit`
   exists at all → say scout/apply are already present from some checkout, so the
   operator does not reinstall over a working channel. Then set `{{KIT_INSTALL}}`
   to (mirror README SSOT; do not invent a different host or script path):

   > Kit skills are not on this machine as a checkout. Get job-kit, then
   > install channels you need (README "Get the kit" + Install sections):
   >
   > ```bash
   > git clone https://github.com/rafaeelricco/job-kit.git
   > cd job-kit
   > bash scripts/aside/install.sh    # scout/apply into Aside
   > bash scripts/agents/install.sh  # only if coding-agent homes lack job-profile-init
   > ```
   >
   > Private clone: use your host's auth. Do not run kit installers from the
   > profile directory.
