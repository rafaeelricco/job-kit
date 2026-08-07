# Activate

1. `REPO="$(cd "<target>" && pwd -P)"` — STOP if not a directory.
2. Require `"$REPO/data/candidate.yaml"` and `"$REPO/data/job_search.yaml"`;
   else STOP (same two-file probe as Route). Create path: this runs **after**
   emit (and fill unless scaffold-only) so probes exist.
3. Resolve `HOST_HOME`: if `$HOME` ends with `/.aside/runtime/home`, strip
   that suffix; else `HOST_HOME=$HOME`.
4. Resolve `HOST_DEFAULT=$HOST_HOME/.config/job-kit` and this-env
   `JOB_KIT_CONFIG` (non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
   else `HOST_DEFAULT`). Path-convention branch only when `REPO` equals
   **both** `HOST_DEFAULT` and `JOB_KIT_CONFIG` (after `pwd -P` when dirs
   exist). That means XDG is unset or already names the host-default path —
   skills probe `REPO` without a pointer.
   - **Do not write** a host/Aside pointer naming `REPO`.
   - **Do clear** shadowing registrations: read host
     `$HOST_HOME/.config/profile-root` and, when the runtime home exists,
     `$HOST_HOME/.aside/runtime/home/.config/profile-root`. Delete both
     together; if mirror removal fails after host delete, **restore** the host
     pointer (same atomicity as install.sh).
   - Host or mirror line non-empty and resolves to a path other than `REPO`
     (or is unresolvable non-empty) → show that path; ask whether to switch to
     host-default `REPO`. Yes → delete host pointer and mirror; state switched;
     go to (8). No → leave inactive; print later Activate hint; go to (9).
   - No shadowing line (absent/empty, or already `REPO`) → remove any redundant
     pointer/mirror that names `REPO` itself; state host-default-location
     active; go to (8).
   **Fall through to (5)** (write pointers) when:
   - `REPO` is `$XDG_CONFIG_HOME/job-kit` and that differs from `HOST_DEFAULT`
     (Aside often lacks XDG), or
   - `REPO` is `HOST_DEFAULT` but `JOB_KIT_CONFIG` differs (XDG hides
     host-default for coding agents — durable pointer required).
5. Host pointer conflict on `$HOST_HOME/.config/profile-root` (non-convention
   REPO only):
   - Read one-line `current` if file exists.
   - If `current` is a directory, `current_canon="$(cd "$current" && pwd -P)"`;
     else `current_canon=""`.
   - `current_canon` equals `REPO` → if stored `current` differs from `REPO`,
     rewrite host to canonical `REPO`. Then run (7) **unconditionally** — the
     runtime home may have appeared after the host write, or hold a stale line,
     and `job-scout` reads the mirror before the host pointer. State already
     active; go to (9).
   - `current_canon` non-empty and not `REPO` → show `current_canon`; ask
     whether to switch to `REPO`. Yes → continue to (6). No → leave inactive;
     print later Activate hint; go to (9).
   - `current_canon` empty but `current` non-empty → the pointer names a path
     this process cannot traverse (e.g. a live profile under an Aside-blocked
     parent). Treat it as a conflict, **not** a free slot: show `current`, say
     it could not be resolved, ask the same switch question, same Yes/No
     handling. Only an absent or empty pointer line skips the ask.
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
   - `{{GAPS_OR_NONE}}` — remaining Gaps from the fill report, including
     skipped **scout-critical** blockers (not optional/screening shells).
     **Scaffold-only: print the `./emit-tree.md` unfilled inventory, never
     `none`** — that inventory is scout-critical only; a scout run against
     placeholders would search for `TODO-skill`. `none` is correct only for
     register-existing, where this flow wrote no tree.
   - `{{ACTIVATE_NOTE}}` — if Activate ran: host-default-location active, **or**
     host path written + mirror yes/no (including XDG-only defaults); session
     export yes/no. If skipped: how to Activate later (register-existing with
     Yes, or `bash "<target>/scripts/install.sh"` for non-host-default paths —
     mirrors Aside when runtime home exists).
   - `{{KIT_INSTALL}}` — **one** of the two blocks below (pick by resolve).
     Never print bare `bash scripts/agents/install.sh` or
     `bash scripts/aside/install.sh` without an absolute kit root or the
     README get-kit recipe. Operator is often only in a profile directory.

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

Profile `scripts/install.sh` remains for **manual** Activate/switch outside
this skill; the skill never shells it. Manual install also mirrors Aside
runtime home when present (non-host-default paths only).
