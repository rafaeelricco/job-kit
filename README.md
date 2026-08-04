# job-kit

Finding a job by hand does not scale. At volume you hit the same two
bottlenecks every time: **where to look**, and **whether an opening
actually fits** your stack, seniority, geo, and work authorization. Miss
either and you burn time on dead listings or applications that never
clear the form filters.

Agents can run that loop: sweep the surfaces you care about, score fit
against a real profile, and draft applications from profile facts (apply may
stage a labeled form invent only when the ad requires a value no file prints).
That only works when **procedure** (what the agent may do) stays separate
from **facts** (who you are, what you want, what you can prove).

This repo is the procedure: three agent skills on two install channels.
Scout and apply install into [Aside Browser](https://aside.com); profile
init installs into coding agents (Claude Code, Codex, Grok). Salary band, work
authorization, experience, and other facts stay in a profile
directory you control, never in this tree.

- **Agents channel:** installers symlink `job-profile-init` into coding-agent skills.
- **Aside channel:** installers **copy** scout/apply into `~/.aside/u/0/skills/builtin`.
- **No manual clone:** one `remote.sh` command caches the kit and installs both channels;
  the same script uninstalls with `bash -s -- uninstall`.
- **Safe re-runs:** kit-owned destinations re-sync; foreign conflicts fail unless
  you pass `--force`.
- **Facts stay local:** profile `data/` is not part of this repository.

## Which skill goes where

| Skill              | Channel                               | Install            |
| ------------------ | ------------------------------------- | ------------------ |
| `job-scout`        | Aside                                 | `remote.sh aside`  |
| `job-application`  | Aside                                 | `remote.sh aside`  |
| `job-profile-init` | Coding agents (Claude / Codex / Grok) | `remote.sh agents` |

Local-clone equivalents are in [Work locally](#work-locally).

## Install

No clone needed. One command fetches job-kit into a cached checkout
(`~/.local/share/job-kit` by default) and runs the channel installers from
there:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- all
```

`all` installs both channels and skips whichever target is absent — no Aside
profile, or no agent home, is a skip, not an error. Read the script first if
you prefer:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh -o remote.sh
bash remote.sh all
```

| Channel  | Installs                                            |
| -------- | --------------------------------------------------- |
| `all`    | Both, skipping absent targets (default)             |
| `aside`  | `job-scout` + `job-application` (fails if no Aside) |
| `agents` | `job-profile-init` (fails if no agent home)         |
| `fetch`  | Nothing — refresh the cached checkout only          |

Options after the channel are forwarded to the installer. `all` forwards only
`--force`; use an explicit channel for `--skip-claude` / `--skip-codex` /
`--skip-grok`:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- agents --skip-codex
```

| Variable       | Default                  | Role                |
| -------------- | ------------------------ | ------------------- |
| `JOB_KIT_HOME` | `$XDG_DATA_HOME/job-kit` | Cached checkout     |
| `JOB_KIT_REF`  | `main`                   | Branch or tag       |
| `JOB_KIT_SLUG` | `rafaeelricco/job-kit`   | GitHub `owner/repo` |

Uses `git` when present (shallow clone, shallow fetch on re-run), otherwise
`curl`/`wget` + `tar`. **Keep the cached checkout in place** — coding-agent
skills symlink into it, and Aside re-installs read it to prove kit ownership.
Windows needs Git Bash. Installs no profile, no salary or work-auth data, and
logs into nothing.

## Work locally

Clone when you want to edit skills and see the change without reinstalling —
the agents channel symlinks, so edits in the checkout are live:

```bash
git clone https://github.com/rafaeelricco/job-kit.git
cd job-kit
```

Private clone: use whatever auth your host requires (`gh repo clone
rafaeelricco/job-kit`, HTTPS token, or SSH remote). Run the channel installers
from **this** checkout, or pass absolute paths to them. They never clone for
you and never run from a profile directory. Update with `git pull` here, then
re-run the installers you use.

### Coding agents (Claude, Codex, Grok)

**Prerequisites:** Bash; at least one agent home already present
(`~/.claude`, `~/.agents`, or `~/.grok` — open that agent once if missing).

```bash
bash scripts/agents/install.sh
```

Links `skill/job-profile-init` into each eligible target (parent dir must
exist). Destinations match the personal multi-agent layout:

| Target      | Skills root                         |
| ----------- | ----------------------------------- |
| Claude Code | `~/.claude/skills/job-profile-init` |
| Codex       | `~/.agents/skills/job-profile-init` |
| Grok        | `~/.grok/skills/job-profile-init`   |

Idempotent when a link already matches. Foreign conflicts fail; pass
`--force` to replace. Skip a target with `--skip-claude`, `--skip-codex`,
or `--skip-grok`. Single custom dest: absolute `CLAUDE_SKILLS` (escape hatch;
skip flags ignored).

```bash
bash scripts/agents/install.sh --skip-codex
CLAUDE_SKILLS=/path/to/skills bash scripts/agents/install.sh
bash scripts/agents/install.sh --force
```

Does **not** install scout/apply into coding agents. Does not create agent
home dirs, a profile, or salary / work-auth data. Codex skills live under
`~/.agents/skills`, not `~/.codex/skills`. Default multi-target install also
removes legacy kit links under `~/.codex/skills` when present; the
`CLAUDE_SKILLS` single-dest escape hatch skips that cleanup.

### Aside

**Prerequisites:** Bash; Aside Browser with an account profile
(default `~/.aside/u/0`, including a `skills` parent for the builtin root).

```bash
bash scripts/aside/install.sh
```

Copies `skill/{job-scout,job-application}` into
`~/.aside/u/0/skills/builtin/` as real directories (not symlinks). Re-install
re-syncs kit-owned trees. Foreign conflicts fail; pass `--force` to replace them.
Also removes leftover kit-owned trees under `skills/user/` from older installs
(symlinks or marked copies of current or legacy skill basenames).

```bash
ASIDE_ACCOUNT=1 bash scripts/aside/install.sh
ASIDE_SKILLS=/path/to/skills/builtin bash scripts/aside/install.sh
bash scripts/aside/install.sh --force
```

Does **not** install `job-profile-init` into Aside. These scripts only
install skill trees. They do not create a profile, write salary or
work-auth data, or log into any service.

## Update

Remote install: re-run the same one-liner — it refreshes the cached checkout at
`$JOB_KIT_HOME` and re-runs the installers.

Local checkout: `git pull`, then re-run **both** installers you use
(agents: re-link; Aside: re-copy). Channels are independent.

Update never modifies profile checkouts or `~/.config/profile-root`.

Aside install removes legacy kit names (`job-discovery`, `job-apply`,
`profile-scaffold`, `application-stage`, `profile-init`) when they are still
kit-owned for this checkout. Agents install removes legacy `profile-init` the
same way. Search packs live in the installed job-scout skill
(`references/search_packs.yaml`); `impl` stems must match surface reference
basenames (`surface-linkedin-jobs`, `surface-open-web`, …). Profile
`data/search_packs.yaml` is not used — remove if present from older setups.

## Uninstall

No clone needed (same entrypoint as install):

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall
```

| Target                | Removes                                                |
| --------------------- | ------------------------------------------------------ |
| `uninstall` / `… all` | Aside kit copies + agent kit links (default)           |
| `uninstall aside`     | `job-scout` + `job-application` (kit-owned only)       |
| `uninstall agents`    | `job-profile-init` kit links (+ legacy `profile-init`) |

Add `--purge` to delete the cached checkout after skills are removed:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall --purge
```

`uninstall agents` accepts the same `--skip-*` flags as install. Uninstall
only removes kit-owned paths (exact cache path match). Foreign skills stay.

Local checkout:

```bash
bash scripts/agents/uninstall.sh
bash scripts/aside/uninstall.sh
```

After a remote install, channel scripts also live in the cache:

```bash
JOB_KIT_HOME="${JOB_KIT_HOME:-${XDG_DATA_HOME:-$HOME/.local/share}/job-kit}"
bash "$JOB_KIT_HOME/scripts/agents/uninstall.sh"
bash "$JOB_KIT_HOME/scripts/aside/uninstall.sh"
```

Delete the cache only after uninstall (or use `--purge`). Removing the cache
first strands coding-agent symlinks that still point into it.

Each uninstall only touches its channel. Agents uninstall supports the same
`--skip-*` / `CLAUDE_SKILLS` shape as install. Aside never removes coding-agent
links; agents never removes Aside links. Leaves profile checkouts and
`~/.config/profile-root` alone.

## Installed Paths

| Source                   | Destination                                   |
| ------------------------ | --------------------------------------------- |
| `skill/job-scout`        | `~/.aside/u/0/skills/builtin/job-scout`       |
| `skill/job-application`  | `~/.aside/u/0/skills/builtin/job-application` |
| `skill/job-profile-init` | `~/.claude/skills/job-profile-init`           |
| `skill/job-profile-init` | `~/.agents/skills/job-profile-init`           |
| `skill/job-profile-init` | `~/.grok/skills/job-profile-init`             |

Override Aside root with `ASIDE_SKILLS` (or legacy `ASIDE_SKILLS_USER`) or
`ASIDE_ACCOUNT`; single agent dest with `CLAUDE_SKILLS`. Run the installer as
your normal user, not with `sudo`.

## Getting Started

### 1. Install profile init into coding agents

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- agents
```

From a clone instead: `bash scripts/agents/install.sh`.

### 2. Create or register a profile

With an agent that loaded `job-profile-init`:

```text
/job-profile-init
```

**Register existing:** Route picks an already-valid profile → **Activate ask**
only → skill step 4 pointer work if Yes. No Folder / Source / Identity /
Approve / emit / fill.

**Create:** Route → Folder → **Activate ask** (stores Yes/No; does **not**
write yet) → Source (CV / LinkedIn export path or paste, or scaffold-only) →
Identity (draft from SoT; ask only empties/conflicts) → **Approve** (first
tree write). Then emit → fill (unless scaffold-only) → **Activate** only if
ask was Yes: host `~/.config/profile-root` plus Aside runtime mirror when
that tree exists; optional session `export PROFILE_ROOT` for the coding agent
only (Aside does **not** inherit process env). Fact fill is no-invent; Gaps
listed. Skills stay in job-kit, not in the profile.

Later Activate/switch without the skill: run the **profile** checkout’s
`bash scripts/install.sh` (emitted under that profile; not a kit-root script).

### 3. Fill facts

On create (not scaffold-only / not register-only), after SoT gate the skill:
writes Fact shells from SoT → asks once, in one message, for blockers left
empty (salary band, notice period, home-market work authorization, EOR
Yes/No; `skip` always valid → **Gaps**) → confirms Suggestions
(positions / keywords / blacklists) before write →
CV place → Gaps report. Blockers are never invented or defaulted. Template
defaults for `work_model` / levels / `job_types` stay unless SoT contradicts.
Gaps name only what still blocks a useful scout (those blockers plus empty
positions / primary keywords / locations after suggestions). Screening
binaries and other optional Fact shells stay empty until you hand-edit or
answer them in the ATS at apply time. Ensure `cv/en-us-resume.pdf` exists
before apply. Letter depth comes from `data/experiences.yml` and
`data/projects.yml`.

No demographic or EEO self-identification is stored in the profile — those
questions are voluntary and per-employer, so you answer them in the ATS form.

### 4. Run scout and apply (Aside)

Install the Aside channel first if not already:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- aside
```

From a clone instead: `bash scripts/aside/install.sh`.

```text
/job-scout
/job-application
```

**job-scout** lists and ranks openings across every pack in
`skill/job-scout/references/search_packs.yaml` (every pack, YAML order); it never applies, messages, or connects.
**job-application** drafts and stages one application at a time; it may open
an Apply control that only reveals the form, stops at review, and waits for
an explicit yes. Neither skill transmits Submit / Send / final Confirm.

## Profile root

`/job-profile-init` **Activate** (skill step 4 after intake, only if Activate
ask was Yes) is how the durable machine pointer is set. Manual path without
the skill: the **profile** checkout’s `scripts/install.sh` (not job-kit’s
`scripts/agents` or `scripts/aside`). Durable writes:

| File                                                  | Who reads it                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `$HOST_HOME/.config/profile-root`                     | Coding agents; Aside dual-home step                                                               |
| `$HOST_HOME/.aside/runtime/home/.config/profile-root` | Aside when sandboxed `$HOME` is runtime home (mirror on Activate or profile `scripts/install.sh`) |

`PROFILE_ROOT` is a **session override** only (coding agent or shell). Aside
does not inherit env from the init session.

Skills resolve the active profile in this order:

1. `$PROFILE_ROOT` if that directory has `data/candidate.yaml` and
   `data/job_search.yaml`
2. `$HOME/.config/profile-root` (one absolute path line) with the same probe
3. **Aside:** if `$HOME` is `…/.aside/runtime/home`, also read the **host**
   home’s `~/.config/profile-root` (same one-line absolute path)
4. Walk the session CWD upward until both probe files exist
5. Otherwise stop and name what was tried

Override for one session without rewriting pointer files:

```bash
PROFILE_ROOT=/path/to/other-profile
```

Aside must be allowed to **read** that directory (sandbox). A correct pointer
to a blocked path still fails — grant FS access or move the profile to an
allowed location.

## Skills

| Skill              | Role                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `job-scout`        | List-only job scout across every pack in skill-local `references/search_packs.yaml` (Aside) |
| `job-application`  | Draft letter and form fields for one posting; stage only, never submit (Aside)              |
| `job-profile-init` | Create a data-only profile, or register/activate an existing one (coding agents)            |

## Layout

| Path                      | Role                                            |
| ------------------------- | ----------------------------------------------- |
| `skill/job-scout/`        | Scout law, contracts, surfaces                  |
| `skill/job-application/`  | Apply law, draft contract                       |
| `skill/job-profile-init/` | Intake + templates for empty profiles           |
| `scripts/aside/`          | Aside install / uninstall (scout+apply)         |
| `scripts/agents/`         | Coding-agent install / uninstall (profile init) |
| `scripts/remote.sh`       | Fetch to cache + install or uninstall (no clone) |

## License

MIT
