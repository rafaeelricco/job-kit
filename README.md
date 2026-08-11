# job-kit

Five agent skills for running a job search at volume: sweep the surfaces you
care about, score fit against a real profile, draft applications from profile
facts, read back what a run saved. Procedure lives here. Facts — salary band,
work authorization, experience — live in a profile directory you control (default
`${XDG_CONFIG_HOME:-~/.config}/job-kit`) and never enter this repo.

Two install channels: scout, apply, config, and tracker run in
[Aside Browser](https://aside.com); profile init (plus config and tracker as
symlinks) run in coding agents (Claude Code, Codex, Grok).

| Skill                | Role                                                                                   | Channel                         | Installed under                                                     |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `job-scout`          | Run every enabled pack in the profile's `data/search_packs.yaml` and rank the job rows | Aside (copy)                    | `~/.aside/u/0/skills/builtin/`                                      |
| `job-application`    | Draft, stage, and after approve submit one posting                                     | Aside (copy)                    | `~/.aside/u/0/skills/builtin/`                                      |
| `job-profile-init`   | Create a data-only profile, or register/activate an existing one                       | Coding agents (symlink)         | `~/.claude`, `~/.agents`, `~/.grok`                                 |
| `job-profile-config` | Show an existing profile and edit search intent or boards; diff → confirm → write      | Aside (copy) + agents (symlink) | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok` |
| `job-tracker`        | Read the profile's `scout/jobs/` store: dossiers and application status                | Aside (copy) + agents (symlink) | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok` |

Each lands under its own name — coding-agent skills at
`<agent home>/skills/<skill>`. Scout never applies, messages, connects, or submits
applications; a gate that blocks listing → it signs in or creates a browse account.
job-application clicks Submit / Send / final Confirm only after an explicit review
approve.

## Install

One command, no clone. It caches the kit at `~/.local/share/job-kit` and runs
the channel installers from there:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- all
```

Read it first if you prefer:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh -o remote.sh
bash remote.sh all
```

| Argument       | Installs                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `all`          | Both channels; an absent target is skipped, not an error — fails only if both are absent (default) |
| `aside`        | `job-scout` + `job-application` + `job-profile-config` + `job-tracker` (fails if no Aside)         |
| `agents`       | `job-profile-init` + `job-profile-config` + `job-tracker` (fails if no agent home)                 |
| `fetch`        | Nothing — refresh the cached checkout only                                                         |
| `uninstall`    | See [Uninstall](#uninstall)                                                                        |
| `-h`, `--help` | Nothing — print usage                                                                              |

Options after the argument are forwarded to the installer. `all` forwards only
`--force`; use an explicit channel for the skip flags:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- agents --skip-codex
```

| Knob                                             | Default                  | Role                                                              |
| ------------------------------------------------ | ------------------------ | ----------------------------------------------------------------- |
| `--force`                                        | off                      | Replace a foreign (non-kit) destination                           |
| `--skip-claude` / `--skip-codex` / `--skip-grok` | off                      | Skip one agent target                                             |
| `JOB_KIT_HOME`                                   | `$XDG_DATA_HOME/job-kit` | Cached checkout                                                   |
| `JOB_KIT_REF`                                    | `main`                   | Branch or tag                                                     |
| `JOB_KIT_SLUG`                                   | `rafaeelricco/job-kit`   | GitHub `owner/repo`                                               |
| `ASIDE_ACCOUNT`                                  | `0`                      | Aside account profile                                             |
| `ASIDE_SKILLS`                                   | —                        | Custom Aside builtin root, absolute (legacy: `ASIDE_SKILLS_USER`) |
| `CLAUDE_SKILLS`                                  | —                        | Single absolute agent dest; skip flags ignored                    |

Re-runs are safe: kit-owned destinations re-sync, foreign ones fail unless you
pass `--force`. Uses `git` when present (shallow clone, shallow fetch on
re-run), otherwise `curl`/`wget` + `tar`. Windows needs Git Bash. Run as your
normal user, not with `sudo`.

**Keep the cached checkout in place** — coding-agent skills symlink into it, and
Aside re-installs read it to prove kit ownership.

These scripts install skill trees and nothing else: no profile, no salary or
work-auth data, no login to any service.

## Getting started

**1. Create or register a profile.** Install the agents channel, then run the
skill in Claude Code, Codex, or Grok:

```text
/job-profile-init
```

It enters PLAN mode, routes between creating a new profile and registering an
existing one, and asks every user-owned profile field. Source values and
template defaults require explicit confirmation, edits, or skips. Facts are
never invented; the profile stores one confirmed `seniority_level` string and
final extra observations in `data/observations.yaml`. Letter depth comes from
`data/experiences.yml` and `data/projects.yml`.

No demographic or EEO self-identification is stored — those questions are
voluntary and per-employer, so you answer them in the ATS form.

**2. Scout and apply.** Install the Aside channel, then run either skill in
Aside Browser:

```text
/job-scout
/job-application
```

Scout runs every enabled pack in your profile's `data/search_packs.yaml`, in file
order, and ranks the job rows it extracts. Application drafts and stages one posting at a
time; it opens an Apply control only when that control reveals the form, stops at
review, and on explicit yes submits (account wall, required terms, Submit).

Scout writes one dossier per live job to
`scout/jobs/{first_seen}-{company}--{title}.md`. That is the only path scout
writes; the full ranked report (including People/TA, Dropped, Query log, Gaps)
stays in chat. `data/` and `cv/` stay read-only to it. Set `status:` in a
dossier's frontmatter as you apply — job-application sets `applied` itself after submit
success (or once you confirm you submitted outside it), and records the letter, the form
answers, and the ad under the dossier's Application log; later statuses (`interview`,
`offer`, `rejected`, `dropped`) are yours to set. Re-running scout never overwrites
`status:`, and never renames the file.

Applying needs exactly one CV PDF that opens: a tailored one compiled for that
application, or `cv/en-us-resume.pdf` as the fallback. With neither,
job-application stops and asks you to build it.

**3. Tune the search.** Day-2 edits on a profile that already exists, in Aside
or a coding agent:

```text
/job-profile-config
```

`show` prints the profile, `gaps` names what still blocks a useful scout, and
`set` / `sources add` / `sources remove` change keywords, positions, locations,
and boards. It writes only `data/job_search.yaml`, `data/sources.yaml`, and
`data/profile_card.yaml` — everything else under the profile is read-only here,
nothing is written before it prints a diff and you say yes, and it makes no
network calls.

**4. Read back what scout saved.** In Aside or any coding-agent session:

```text
/job-tracker
```

Resolves your Profile root, prints `scout/jobs/`, and answers from the dossiers
already on disk. It never writes one.

## Profile root

Skills resolve the active profile in this order:

1. `$PROFILE_ROOT`, if that directory has `data/candidate.yaml` and
   `data/job_search.yaml`
2. `$HOME/.config/profile-root` (one absolute path line), same probe — explicit
   Activate/install wins over path convention
3. **Aside:** host home's `~/.config/profile-root` when dual-home applies
4. Default config dirs (same probe, each not already tried):
   - `${XDG_CONFIG_HOME:-$HOME/.config}/job-kit`
   - Host-default fallback `$HOST_HOME/.config/job-kit` when that differs
     (Aside dual-home uses host home; always probed so host-default profiles
     resolve across XDG and non-XDG environments without a pointer)
5. Walk the session CWD upward until both probe files exist
6. Otherwise stop and name what was tried

`/job-profile-init` **Activate** sets durable pointers for non-host-default
paths (including XDG-only defaults). Host-default `$HOST_HOME/.config/job-kit`
is path convention. Without the skill: create/move the tree there, or write the
absolute profile path as the single line of `~/.config/profile-root`.

| File                                                  | Who reads it                                     |
| ----------------------------------------------------- | ------------------------------------------------ |
| `${XDG_CONFIG_HOME:-$HOME/.config}/job-kit`           | Default profile root (direct probe)              |
| `$HOST_HOME/.config/profile-root`                     | Coding agents; Aside dual-home step (legacy)     |
| `$HOST_HOME/.aside/runtime/home/.config/profile-root` | Aside when sandboxed `$HOME` is the runtime home |

`PROFILE_ROOT` is a **session override** only — Aside does not inherit env from
the init session:

```bash
PROFILE_ROOT=/path/to/other-profile
```

Aside must be allowed to **read** that directory. A correct pointer to a
sandbox-blocked path still fails — grant FS access or move the profile to an
allowed location.

## Update

Remote install: re-run the same one-liner — it refreshes the cached checkout and
re-runs the installers. Local checkout: `git pull`, then re-run the installers
you use. Channels are independent.

Update never modifies profile checkouts, the default config dir contents, or
`~/.config/profile-root`. Installs
also clear kit-owned copies of legacy skill names (`job-discovery`, `job-apply`,
`profile-scaffold`, `application-stage`, `profile-init`) and leftover kit trees
under Aside's `skills/user/`.

## Uninstall

One script — interactive pick, or pass targets. Every run prints a plan of
exactly what it will remove before it removes anything:

```bash
bash scripts/uninstall.sh
# from cache after a remote install:
bash "${JOB_KIT_HOME:-${XDG_DATA_HOME:-$HOME/.local/share}/job-kit}/scripts/uninstall.sh"
```

| Choice / target | Removes                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Aside           | `job-scout` + `job-application` + `job-profile-config` + `job-tracker` kit copies                |
| Agents          | `job-profile-init` + `job-profile-config` + `job-tracker` kit links (+ legacy `profile-init`)    |
| Profile         | `${XDG_CONFIG_HOME:-~/.config}/job-kit` (+ host-default if different) and matching pointer files |
| Cache           | Cached checkout at `JOB_KIT_HOME`                                                                |
| **All**         | Aside + agents + **profile** + cache                                                             |

Only kit-owned skill paths are removed. Foreign skills stay. A plan containing
profile or cache data requires typing `yes`; a plan of re-installable links takes
`[Y/n]`. `--yes` skips both, `--dry-run` prints the plan and stops.

`--only` selects a subset instead of positional targets — by channel (`aside`,
`agents`), by Aside skill (`job-scout`, `job-application`, `job-profile-config`,
`job-tracker`), or by agent home (`claude`, `codex`, `grok`), plus `profile` and
`cache`. An Aside skill subset cannot be combined with `cache`: the unselected
skill would still point at it.

```bash
bash scripts/uninstall.sh --only claude,job-scout --dry-run
```

Curl / non-interactive skills-only (does **not** delete profile data):

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall
# skills + kit cache:
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall --purge
```

`uninstall agents` via remote still accepts `--skip-claude` / `--skip-codex` /
`--skip-grok`. `--purge` is full-skills uninstall only (refused on partial
targets or while `CLAUDE_SKILLS` / `ASIDE_SKILLS` narrow a channel).

## Work locally

Clone when you want to edit skills and see the change without reinstalling — the
agents channel symlinks, so edits in the checkout are live:

```bash
git clone https://github.com/rafaeelricco/job-kit.git
cd job-kit
bash scripts/install.sh          # interactive menu, or: all | aside | agents
```

Prerequisites: Bash, plus the target for whichever channel you install — at
least one agent home (`~/.claude`, `~/.agents`, or `~/.grok`; open that agent
once if missing), and an Aside account profile (`~/.aside/u/0`, including a
`skills` parent). Private clone: use whatever auth your host requires (`gh repo
clone rafaeelricco/job-kit`, HTTPS token, or SSH remote).

Run the installer from **this** checkout, or pass an absolute path to it. It
never clones for you and never runs from a profile directory. Channel wrappers
(`scripts/agents/install.sh`, `scripts/aside/install.sh`) still work.

```bash
bash scripts/install.sh agents --skip-codex
bash scripts/install.sh --only claude --dry-run
CLAUDE_SKILLS=/path/to/skills bash scripts/install.sh agents
ASIDE_ACCOUNT=1 bash scripts/install.sh aside
```

Codex skills live under `~/.agents/skills`, not `~/.codex/skills`; a default
multi-target install also removes legacy kit links there, which the
`CLAUDE_SKILLS` single-dest escape hatch skips.

| Path                        | Role                                                |
| --------------------------- | --------------------------------------------------- |
| `skill/job-scout/`          | Scout law, contracts, surfaces                      |
| `skill/job-application/`    | Apply law, draft contract, approve-gated submit     |
| `skill/job-profile-init/`   | Intake + templates for empty profiles               |
| `skill/job-profile-config/` | Show + edit search intent and boards                |
| `skill/job-tracker/`        | Read the profile's scout store; never writes        |
| `scripts/install.sh`        | Single install: plan, confirm, apply (aside+agents) |
| `scripts/aside/`            | Aside lib + thin install wrapper                    |
| `scripts/agents/`           | Agents lib + thin install wrapper                   |
| `scripts/uninstall.sh`      | Single uninstall: plan, confirm, apply              |
| `scripts/remote.sh`         | Fetch to cache + install or uninstall (no clone)    |

Search packs live in your profile at `data/search_packs.yaml`, emitted by
`/job-profile-init` and edited by `/job-profile-config packs`. `impl` stems must
match surface reference basenames (`surface-linkedin-jobs`, `surface-open-web`, …).
`skill/job-scout/references/search_packs.yaml` is the fallback deck for profiles
created before the deck moved; it must stay byte-identical to
`skill/job-profile-init/templates/data/search_packs.yaml`.

## License

MIT
