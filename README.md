# job-kit

Five agent skills for running a job search at volume: sweep the surfaces you
care about, score fit against a real profile, draft applications from profile
facts, read back what a run saved. Procedure lives here. Facts — salary band,
work authorization, experience — live in a profile directory you control (default
`${XDG_CONFIG_HOME:-~/.config}/job-kit`) and never enter this repo.

Two install channels: scout and apply run in [Aside Browser](https://aside.com),
profile init, config, and tracker run in coding agents (Claude Code, Codex, Grok).

| Skill                | Role                                                                                                | Channel                 | Installed under                     |
| -------------------- | --------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------- |
| `job-scout`          | Run every enabled pack in the profile's `data/search_packs.yaml` (file order) and rank the job rows | Aside (copy)            | `~/.aside/u/0/skills/builtin/`      |
| `job-application`    | Draft letter and form fields for one posting; stage only                                            | Aside (copy)            | `~/.aside/u/0/skills/builtin/`      |
| `job-profile-init`   | Create a data-only profile, or register/activate an existing one                                    | Coding agents (symlink) | `~/.claude`, `~/.agents`, `~/.grok` |
| `job-profile-config` | Show an existing profile and edit search intent or boards; diff → confirm → write                   | Coding agents (symlink) | `~/.claude`, `~/.agents`, `~/.grok` |
| `job-tracker`        | Read the profile's `scout/` store: dossiers, run reports, application status                        | Coding agents (symlink) | `~/.claude`, `~/.agents`, `~/.grok` |

Each lands under its own name — coding-agent skills at
`<agent home>/skills/<skill>`. Scout never applies, messages, or connects.
Neither Aside skill transmits Submit / Send / final Confirm.

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
| `aside`        | `job-scout` + `job-application` (fails if no Aside)                                                |
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
time; it may open an Apply control that only reveals the form, then stops at
review and waits for an explicit yes.

Scout writes one dossier per live job to `scout/jobs/{first_seen}-{company}--{title}.md`,
and a per-run record to `scout/runs/{YYYY-MM-DD}-scout.md` holding only what the ranked
list cannot: recruiters, pack yield, dropped rows, gaps, and a `url|company|title|score`
manifest frozen at that run. Every other job fact lives in the dossier and is never copied
into the run file. Those two paths are the
only thing scout writes; `data/` and `cv/` stay read-only to it. Set `status:` in a
dossier's frontmatter as you apply — re-running scout never overwrites it, and never
renames the file.

Applying needs exactly one CV PDF that opens: a tailored one compiled for that
application, or `cv/en-us-resume.pdf` as the fallback. With neither,
job-application stops and asks you to build it.

**3. Tune the search.** Day-2 edits on a profile that already exists, back in a
coding agent:

```text
/job-profile-config
```

`show` prints the profile, `gaps` names what still blocks a useful scout, and
`set` / `sources add` / `sources remove` change keywords, positions, locations,
and boards. It writes only `data/job_search.yaml`, `data/sources.yaml`, and
`data/profile_card.yaml` — everything else under the profile is read-only here,
nothing is written before it prints a diff and you say yes, and it makes no
network calls.

**4. Read back what scout saved.** Any coding-agent session:

```text
/job-tracker
```

Resolves your Profile root, prints the `scout/` store paths, and answers from the
dossiers already on disk. It never writes one.

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

One script — interactive pick, or pass targets:

```bash
bash scripts/uninstall.sh
# from cache after a remote install:
bash "${JOB_KIT_HOME:-${XDG_DATA_HOME:-$HOME/.local/share}/job-kit}/scripts/uninstall.sh"
```

| Choice / target | Removes                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Aside           | `job-scout` + `job-application` kit copies                                                       |
| Agents          | `job-profile-init` + `job-profile-config` + `job-tracker` kit links (+ legacy `profile-init`)    |
| Profile         | `${XDG_CONFIG_HOME:-~/.config}/job-kit` (+ host-default if different) and matching pointer files |
| Cache           | Cached checkout at `JOB_KIT_HOME`                                                                |
| **All**         | Aside + agents + **profile** + cache                                                             |

Only kit-owned skill paths are removed. **All** / **Profile** permanently delete
profile facts (type `yes` unless `--yes`). Foreign skills stay.

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
bash scripts/agents/install.sh
bash scripts/aside/install.sh
```

Prerequisites: Bash, plus the target for whichever channel you install — at
least one agent home (`~/.claude`, `~/.agents`, or `~/.grok`; open that agent
once if missing), and an Aside account profile (`~/.aside/u/0`, including a
`skills` parent). Private clone: use whatever auth your host requires (`gh repo
clone rafaeelricco/job-kit`, HTTPS token, or SSH remote).

Run the installers from **this** checkout, or pass absolute paths to them. They
never clone for you and never run from a profile directory.

```bash
bash scripts/agents/install.sh --skip-codex
CLAUDE_SKILLS=/path/to/skills bash scripts/agents/install.sh
ASIDE_ACCOUNT=1 bash scripts/aside/install.sh
```

Codex skills live under `~/.agents/skills`, not `~/.codex/skills`; a default
multi-target install also removes legacy kit links there, which the
`CLAUDE_SKILLS` single-dest escape hatch skips.

| Path                        | Role                                             |
| --------------------------- | ------------------------------------------------ |
| `skill/job-scout/`          | Scout law, contracts, surfaces                   |
| `skill/job-application/`    | Apply law, draft contract                        |
| `skill/job-profile-init/`   | Intake + templates for empty profiles            |
| `skill/job-profile-config/` | Show + edit search intent and boards             |
| `skill/job-tracker/`        | Read the profile's scout store; never writes     |
| `scripts/aside/`            | Aside install (scout+apply)                      |
| `scripts/agents/`           | Coding-agent install (init + config + tracker)   |
| `scripts/uninstall.sh`      | Single interactive / flagged uninstall           |
| `scripts/remote.sh`         | Fetch to cache + install or uninstall (no clone) |

Search packs live in your profile at `data/search_packs.yaml`, emitted by
`/job-profile-init` and edited by `/job-profile-config packs`. `impl` stems must
match surface reference basenames (`surface-linkedin-jobs`, `surface-open-web`, …).
`skill/job-scout/references/search_packs.yaml` is the fallback deck for profiles
created before the deck moved; it must stay byte-identical to
`skill/job-profile-init/templates/data/search_packs.yaml`.

## License

MIT
