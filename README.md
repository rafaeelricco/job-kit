# job-kit

Finding a job by hand does not scale. At volume you hit the same two
bottlenecks every time: **where to look**, and **whether an opening
actually fits** your stack, seniority, geo, and work authorization. Miss
either and you burn time on dead listings or applications that never
clear the form filters.

Agents can run that loop: sweep the surfaces you care about, score fit
against a real profile, and draft applications without inventing facts.
That only works when **procedure** (what the agent may do) stays separate
from **facts** (who you are, what you want, what you can prove).

This repo is the procedure: three agent skills on two install channels.
Scout and apply install into [Aside Browser](https://aside.com); profile
init installs into coding agents (Claude Code, Codex, Grok). Salary band, work
authorization, experience, and other facts stay in a profile
directory you control, never in this tree.

- **Agents channel:** installers symlink `job-profile-init` into coding-agent skills.
- **Aside channel:** installers **copy** scout/apply into `~/.aside/u/0/skills/builtin`.
- **Safe re-runs:** kit-owned destinations re-sync; foreign conflicts fail unless
  you pass `--force`.
- **Facts stay local:** profile `data/` is not part of this repository.

## Which skill goes where

| Skill              | Channel                               | Install                     |
| ------------------ | ------------------------------------- | --------------------------- |
| `job-scout`        | Aside                                 | `scripts/aside/install.sh`  |
| `job-application`  | Aside                                 | `scripts/aside/install.sh`  |
| `job-profile-init` | Coding agents (Claude / Codex / Grok) | `scripts/agents/install.sh` |

## Get the kit

Installers need a **local job-kit checkout**. They do not clone for you and do
not run from a profile directory. If you only have a profile tree, obtain the
kit first:

```bash
git clone https://github.com/rafaeelricco/job-kit.git
cd job-kit
```

Private clone: use whatever auth your host requires (`gh repo clone
rafaeelricco/job-kit`, HTTPS token, or SSH remote). Then run the channel
installers below from **this** checkout (or pass absolute paths to those
scripts). Update later with `git pull` in the same checkout, then re-run the
installers you use.

## Install — coding agents (Claude, Codex, Grok)

**Prerequisites:** Bash, Git; at least one agent home already present
(`~/.claude`, `~/.agents`, or `~/.grok` — open that agent once if missing).

From that job-kit checkout (after [Get the kit](#get-the-kit) if needed):

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
`~/.agents/skills`, not `~/.codex/skills` (legacy kit links there are
removed when present).

## Install — Aside

**Prerequisites:** Bash, Git, Aside Browser with an account profile
(default `~/.aside/u/0`).

From that job-kit checkout (after [Get the kit](#get-the-kit) if needed):

```bash
bash scripts/aside/install.sh
```

Copies `skill/{job-scout,job-application}` into
`~/.aside/u/0/skills/builtin/` as real directories (not symlinks). Re-install
re-syncs kit-owned trees. Foreign conflicts fail; pass `--force` to replace them.
Also removes any leftover kit links under `skills/user/` from older installs.

```bash
ASIDE_ACCOUNT=1 bash scripts/aside/install.sh
ASIDE_SKILLS=/path/to/skills/builtin bash scripts/aside/install.sh
bash scripts/aside/install.sh --force
```

Does **not** install `job-profile-init` into Aside. These scripts only
install skill trees. They do not create a profile, write salary or
work-auth data, or log into any service.

## Update

`git pull` in the checkout, then re-run **both** installers you use
(agents: re-link; Aside: re-copy). Channels are independent.

Update never modifies profile checkouts or `~/.config/profile-root`.

Aside install removes legacy kit names (`job-discovery`, `job-apply`,
`profile-scaffold`, `application-stage`, `profile-init`) when they are still
kit-owned for this checkout. Agents install removes legacy `profile-init` the
same way. Existing profile `data/search_packs.yaml` must use `impl` stems
that match current job-scout reference basenames
(`surface-linkedin-jobs`, `surface-open-web`, …).

## Uninstall

```bash
bash scripts/agents/uninstall.sh
bash scripts/aside/uninstall.sh
```

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

If you do not already have a job-kit checkout, start with
[Get the kit](#get-the-kit). Then from the checkout:

```bash
bash scripts/agents/install.sh
```

### 2. Create a profile

With an agent that loaded `job-profile-init`:

```text
/job-profile-init
```

Intake is stage-shaped: **Route** (register existing or create), **Folder**,
**Source** (CV / LinkedIn export path or paste, or scaffold-only), **Identity**
(draft from SoT; ask only empties/conflicts), then **Approve** before any write.
Register-only registers `~/.config/profile-root` (skill-owned; no profile
`install.sh`) and stops. Create writes the data-only tree, fills Fact-law YAML
from SoT (no invent; gaps listed), confirms search pack places, then registers
the same way. Skills stay in job-kit, not in the profile.

### 3. Fill facts

Review the fill **Gaps** report. Hand-edit only what SoT could not supply
(common: visa/sponsorship, salary band, EOR Yes/No). Ensure `cv/en-us-resume.pdf`
exists before apply. Letter depth comes from what you put in `data/experiences.yml`
and `data/projects.yml`.

### 4. Run scout and apply (Aside)

Install Aside channel first if not already:

```bash
bash /absolute/path/to/job-kit/scripts/aside/install.sh
# or, from a job-kit checkout:
# bash scripts/aside/install.sh
```

```text
/job-scout
/job-application
```

**job-scout** lists and ranks openings; it never applies or messages.
**job-application** drafts and stages one application at a time; it stops at review
and waits for an explicit yes. Neither skill submits.

## Profile root

Skills resolve the active profile in this order:

1. `$PROFILE_ROOT` if that directory has `data/candidate.yaml` and
   `data/job_search.yaml`
2. `$HOME/.config/profile-root` (one absolute path line) with the same probe
3. **Aside:** if `$HOME` is `…/.aside/runtime/home`, also read the **host**
   home’s `~/.config/profile-root` (same one-line absolute path). Profile init
   and `scripts/install.sh` register under the real user home; Aside’s sandboxed
   `HOME` does not share that file unless this step runs.
4. Walk the session CWD upward until both probe files exist
5. Otherwise stop and name what was tried

Override for a second profile without rewriting the config file:

```bash
PROFILE_ROOT=/path/to/other-profile
```

Aside must be allowed to **read** that directory (sandbox). A correct pointer
to a blocked path still fails — grant FS access or move the profile to an
allowed location.

## Skills

| Skill              | Role                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| `job-scout`        | List-only job scout across every pack in `data/search_packs.yaml` (Aside) |
| `job-application`  | Draft letter and form fields for one posting; stage only (Aside)          |
| `job-profile-init` | Create a new data-only profile checkout (coding agents)                   |

## Layout

| Path                      | Role                                            |
| ------------------------- | ----------------------------------------------- |
| `skill/job-scout/`        | Scout law, contracts, surfaces                  |
| `skill/job-application/`  | Apply law, draft contract                       |
| `skill/job-profile-init/` | Intake + templates for empty profiles           |
| `scripts/aside/`          | Aside install / uninstall (scout+apply)         |
| `scripts/agents/`         | Coding-agent install / uninstall (profile init) |

## License

MIT
