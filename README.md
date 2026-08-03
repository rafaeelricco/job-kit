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
authorization, experience, and client evidence stay in a profile
directory you control, never in this tree.

- **One skill tree:** installers symlink here; no generated skill copies.
- **Safe re-runs:** exact links are no-ops; foreign conflicts fail unless
  you pass `--force`.
- **Facts stay local:** `data/` and `private/` are not part of this repository.

## Which skill goes where

| Skill              | Channel                               | Install                     |
| ------------------ | ------------------------------------- | --------------------------- |
| `job-scout`        | Aside                                 | `scripts/aside/install.sh`  |
| `job-application`  | Aside                                 | `scripts/aside/install.sh`  |
| `job-profile-init` | Coding agents (Claude / Codex / Grok) | `scripts/agents/install.sh` |

## Install — coding agents (Claude, Codex, Grok)

**Prerequisites:** Bash, Git; at least one agent home already present
(`~/.claude`, `~/.agents`, or `~/.grok` — open that agent once if missing).

From a job-kit checkout:

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

From a job-kit checkout:

```bash
bash scripts/aside/install.sh
```

Links `skill/{job-scout,job-application}` into
`~/.aside/u/0/skills/user/` as absolute symlinks. Idempotent when links
already match. Foreign conflicts fail; pass `--force` to replace them.

```bash
ASIDE_ACCOUNT=1 bash scripts/aside/install.sh
ASIDE_SKILLS_USER=/path/to/skills/user bash scripts/aside/install.sh
bash scripts/aside/install.sh --force
```

Does **not** install `job-profile-init` into Aside. These scripts only
install skill symlinks. They do not create a profile, write salary or
work-auth data, or log into any service.

## Update

`git pull` in the checkout, then re-run **both** installers you use
(idempotent re-link). Channels are independent.

Update never modifies profile checkouts or `~/.config/profile-root`.

Aside install removes legacy kit links (`job-discovery`, `job-apply`,
`profile-scaffold`, `application-stage`, `profile-init`) when they still
point at this checkout. Agents install removes legacy `profile-init` the
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

| Source                   | Destination                                |
| ------------------------ | ------------------------------------------ |
| `skill/job-scout`        | `~/.aside/u/0/skills/user/job-scout`       |
| `skill/job-application`  | `~/.aside/u/0/skills/user/job-application` |
| `skill/job-profile-init` | `~/.claude/skills/job-profile-init`        |
| `skill/job-profile-init` | `~/.agents/skills/job-profile-init`        |
| `skill/job-profile-init` | `~/.grok/skills/job-profile-init`          |

Override Aside root with `ASIDE_SKILLS_USER` or `ASIDE_ACCOUNT`; single agent
dest with `CLAUDE_SKILLS`. Run the installer as your normal user, not with
`sudo`.

## Getting Started

### 1. Install profile init into coding agents

```bash
bash scripts/agents/install.sh
```

### 2. Create a profile

With an agent that loaded `job-profile-init`:

```text
/job-profile-init
```

The intake asks for a target path, identity fields, home market, and a **source
of truth** (CV / LinkedIn export file / notes path or paste). It writes the
data-only tree, then fills Fact-law YAML from that source (no invent; gaps
listed). You confirm search pack places (all or specific). `private/` stays an
empty stub. Skills stay in job-kit, not in the profile.

### 3. Register the profile root

```bash
bash /path/to/your-profile/scripts/install.sh
```

This writes `~/.config/profile-root` to that absolute path so scout and apply
resolve facts when the skills are linked into Aside.

### 4. Fill facts

Review the fill **Gaps** report. Hand-edit only what SoT could not supply
(common: visa/sponsorship, salary band, EOR Yes/No). Add `private/` later when
letters need client depth. Ensure `cv/en-us-resume.pdf` exists before apply.

### 5. Run scout and apply (Aside)

Install Aside channel first if not already:

```bash
bash scripts/aside/install.sh
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
2. `~/.config/profile-root` (one absolute path line) with the same probe
3. Walk the session CWD upward until both probe files exist
4. Otherwise stop and name what was tried

Override for a second profile without rewriting the config file:

```bash
PROFILE_ROOT=/path/to/other-profile
```

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
