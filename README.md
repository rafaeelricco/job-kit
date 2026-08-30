# job-kit

Twelve agent skills for running a job search at volume: sweep the surfaces you
care about, score fit against a real profile, deep-rank dossiers already on disk, tailor a one-page resume from profile Facts, fill and submit applications from profile
facts, read back what a run saved, and update status from Gmail replies. Procedure lives here. Facts — salary band,
work authorization, experience — live in a profile directory you control (default
`${XDG_CONFIG_HOME:-~/.config}/job-kit`) and never enter this repo.

Three install channels. Scout and apply need a browser: run them in
[Aside Browser](https://aside.com), or in a coding agent driving your own Chrome
through the local [browser-use](https://docs.browser-use.com) CLI. Résumé refine, profile init
and stories (plus config, tracker, inbox, and profile-root as symlinks) run in
coding agents (Claude Code, Codex, Grok, Hermes Agent).

| Skill               | Role                                                                                | Channel                              | Installed under                                                                  |
| ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `job-scout`         | Run the packs you pick from the profile deck and rank the job rows                  | Aside (copy) + browser-use (symlink) | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-apply`         | Queue postings; package, review, submit, record — one at a time                     | Aside (copy) + browser-use (symlink) | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-resume-refine` | Tailor one resume page to one scout dossier from profile Facts; compile a PDF       | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-profile-init`  | Create a data-only profile, or register/activate an existing one                    | Coding agents (symlink)              | `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes`                                 |
| `job-profile-me`    | Show an existing profile and edit search intent or boards; diff → confirm → write   | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-profile-root`  | Resolve the absolute Profile root; never writes                                     | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-list`          | Read the profile's `scout/jobs/` store: dossiers and application status             | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-match`         | Deep-rank existing scout dossiers with one shared MatchingPolicy; chat report only  | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-inbox`         | Check Gmail for replies to tracked applications; write status on strong evidence    | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-stories`       | Write and check the interview story deck at `data/stories/`; diff → confirm → write | Coding agents (symlink)              | `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes`                                 |
| `job-pitch`         | Render the story deck as a vetting video script or work-experience bullets          | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |
| `job-humanize`      | Rewrite already-drafted Summary, resume, or pitch prose; keep every claim           | Aside (copy) + agents (symlink)      | `~/.aside/u/0/skills/builtin/`, `~/.claude`, `~/.agents`, `~/.grok`, `~/.hermes` |

Each lands under its own name — coding-agent skills at
`<agent home>/skills/<skill>`. Scout never applies, messages, connects, or submits
applications. It may use an existing session; account creation, signup terms,
passwords, and verification remain operator actions.
job-apply finds postings with job-list, packages them one at a time, and clicks
Submit only after your yes. A posting whose ad sits behind a login or account
wall is skipped; a captcha at submit hands the filled form back to you.

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

| Argument       | Installs                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`          | All three channels; an absent target is skipped, not an error — fails only if all are absent (default)                                                                                                                         |
| `aside`        | `job-scout` + `job-apply` + `job-resume-refine` + `job-profile-me` + `job-list` + `job-match` + `job-pitch` + `job-inbox` + `job-humanize` + `job-profile-root` (fails if no Aside)                                            |
| `agents`       | `job-profile-init` + `job-profile-me` + `job-list` + `job-match` + `job-stories` + `job-pitch` + `job-inbox` + `job-humanize` + `job-profile-root` + `job-resume-refine` (fails if no agent home)                              |
| `browser-use`  | `job-scout` + `job-apply` + `job-resume-refine` + `job-match` + `job-list` + `job-profile-me` + `job-profile-root` + `job-humanize` plus the browser-use driver skill into agent homes; missing CLI or browser prints an offer |
| `fetch`        | Nothing — refresh the cached checkout only                                                                                                                                                                                     |
| `uninstall`    | See [Uninstall](#uninstall)                                                                                                                                                                                                    |
| `-h`, `--help` | Nothing — print usage                                                                                                                                                                                                          |

Options after the argument are forwarded to the installer. `all` forwards only
`--force`; use an explicit channel for the skip flags:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- agents --skip-codex
```

| Knob                                                               | Default                  | Role                                                              |
| ------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------- |
| `--force`                                                          | off                      | Replace a foreign (non-kit) destination                           |
| `--skip-claude` / `--skip-codex` / `--skip-grok` / `--skip-hermes` | off                      | Skip one agent target                                             |
| `JOB_KIT_HOME`                                                     | `$XDG_DATA_HOME/job-kit` | Cached checkout                                                   |
| `JOB_KIT_REF`                                                      | `main`                   | Branch or tag                                                     |
| `JOB_KIT_SLUG`                                                     | `rafaeelricco/job-kit`   | GitHub `owner/repo`                                               |
| `ASIDE_ACCOUNT`                                                    | `0`                      | Aside account profile                                             |
| `ASIDE_SKILLS`                                                     | —                        | Custom Aside builtin root, absolute (legacy: `ASIDE_SKILLS_USER`) |
| `CLAUDE_SKILLS`                                                    | —                        | Single absolute agent dest; skip flags ignored                    |

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
skill in Claude Code, Codex, Grok, or Hermes Agent:

```text
/job-profile-init
```

It routes between creating a new profile and registering an existing one, asks
every user-owned profile field, then presents one plan of everything it will
write and waits for your yes. Source values and
template defaults require explicit confirmation, edits, or skips. Facts are
never invented; final extra observations land in `data/observations.yaml`.

No demographic or EEO self-identification is stored — those questions are
voluntary and per-employer, so you answer them in the ATS form.

**2. Scout and apply.** Pick a runtime for the two browser skills: install the
Aside channel and run them in Aside Browser, or install the `browser-use`
channel and run them in Claude Code, Codex, Grok, or Hermes Agent, where the local
browser-use CLI drives your own Chrome. Either way:

```text
/job-scout
/job-apply
```

The browser-use channel is local only: your own signed-in browser over CDP —
no Browser Use account, no cloud browser, no API key. It needs an agent home,
the `browser-use` CLI, a Chromium-family browser, and the browser-use driver
skill in that home. When the CLI is present, the installer runs
`browser-use skill install` into each home (`--target claude`, `--target agents`,
`--path ~/.grok/skills/browser-use`, `--path ~/.hermes/skills/browser-use`; `CLAUDE_SKILLS` also uses `--path`).
Missing CLI or browser still prints an offer. After that: open
`chrome://inspect/#remote-debugging`, tick Allow remote debugging, and sign in
to the sites you scout.

Scout runs the packs you pick from your profile's `data/search_packs.yaml` and
ranks the job rows it extracts. Apply queues postings through job-list and takes
them one at a time: it reads the dossier and the live ad, resolves the CV, fills
the form from profile Facts, and prints a package for you to review; on your yes
it submits and records.

Scout writes one dossier per persist-set row (live, gate, `score` > 7, match not skip) to
`scout/jobs/{first_seen}-{company}--{title}.md`. That is the only path scout
writes; chat lists those dossiers by score (high to low).
`data/` and `cv/` stay read-only to it. Set `status:` in a dossier's frontmatter
as you apply — job-apply changes `new` to `applied` after confirmed submission
(or once you confirm you submitted outside it), preserves an existing advanced
lifecycle status, and records the package under the dossier's Application log;
later statuses (`interview`, `offer`, `rejected`) are set by `/job-inbox` from
Gmail when evidence is strong; `dropped` stays yours.
Re-running scout never overwrites `status:`, and never renames the file.

The three run as one loop. Scout and inbox stay operator-pasted; inside
`/job-apply`, the CV step may chain `job-resume-refine`, and Record chains
`job-inbox` once after the last posting, scoped to the dossiers it just
recorded — run `/job-inbox` standalone to refresh the whole board:

```text
/job-scout   ranks rows, writes dossiers, STOP (list-only)
/job-apply   queues via job-list; CV step may spawn job-resume-refine for a
             status:new dossier; package → your yes → submit → record;
             job-inbox in-session after the last posting
job-inbox    reports replies, writes status, prints  Next: /job-scout
```

You paste the pointer at the two ends. Scout stays list-only (never applies);
it persists only rows that pass the score and match gates.

Each application carries exactly one CV PDF that opens. For a `status: new`
dossier, job-apply's CV step chains `/job-resume-refine` when `data/cvs.yaml`
`adapt_per_vacancy` is true (absent → true) and carries the single
`scout/applications/{slug}/*_Resume.pdf` (`Nome_Sobrenome_Cargo_Resume.pdf`)
only when `match-report.md` prints `verdict: **PASS**` (`{slug}` = that
dossier filename minus `.md`). A refine STOP or FAIL falls through to a leftover
PASS `*_Resume.pdf` in that `{slug}` dir, then to the base. A posting that prints
it is not accepting applications is skipped before that chain.
`adapt_per_vacancy: false` skips the chain and the leftovers; carry the base
instead. The base is `data/cvs.yaml` `base`; with no `data/cvs.yaml` it is
`cv/en-us-resume.pdf`. The package's `### CV` prints the pick and why. With
neither a resolvable PDF that posting is skipped. `/job-profile-me cvs`
still edits that file — it sets the base CV and the per-vacancy refinement
toggle. Standalone `/job-resume-refine` remains valid.

`/job-resume-refine` needs a LaTeX base under `cv/` — the `.tex` sibling of
the `data/cvs.yaml` `base` PDF. It copies that file whole and tailors roles,
bullets, Skills, and the Summary from profile Facts — without a `.tex` it
stops and names the path it wanted.

**3. Tune the search.** Day-2 edits on a profile that already exists, in Aside
or a coding agent:

```text
/job-profile-me
```

`show` prints the profile, `gaps` names what still blocks a useful scout, and
`set` / `packs add` / `packs remove` change positions, locations,
and boards. It writes only `data/job_search.yaml`, `data/search_packs.yaml`, and
`data/profile_card.yaml` — everything else under the profile is read-only here,
nothing is written before it prints a diff and you say yes, and it makes no
network calls.

**4. Read back what scout saved.** In Aside or any coding-agent session:

```text
/job-list
```

Resolves your Profile root, prints `scout/jobs/`, and answers from the dossiers
already on disk. It never writes one.

**5. Check replies on their own.** `/job-apply` already runs this leg at the end
of every run that submitted something. Run it standalone when you have not
applied to anything today and just want the board refreshed — in Aside or any
coding-agent session:

```text
/job-inbox
```

Default searches Gmail for companies of open applications (`applied` / `interview` / `offer`) only — no inbox-wide keyword sweep. `/job-inbox all` adds every parseable dossier except `dropped` and the keyword sweep. Named company, title, or one or more files is those dossiers only. Opens surviving threads, and writes frontmatter `status:` plus one Application-log line (`— job-inbox`) when match and outcome are strong. Ambiguous mail is skipped, not asked. It never sends mail and never creates a dossier from unmatched recruiters.

An apply session with no Gmail transport stops the inbox leg and says so — the
application is recorded either way, and you can run `/job-inbox` later from a
session that has one.

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
also clear kit-owned copies of legacy skill names (`job-discovery`, `job-application`,
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

| Choice / target | Removes                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Aside           | `job-scout` + `job-apply` + `job-resume-refine` + `job-profile-me` + `job-list` + `job-match` + `job-pitch` + `job-inbox` + `job-humanize` + `job-profile-root` kit copies                                   |
| Agents          | `job-profile-init` + `job-profile-me` + `job-list` + `job-match` + `job-stories` + `job-pitch` + `job-inbox` + `job-humanize` + `job-profile-root` + `job-resume-refine` kit links (+ legacy `profile-init`) |
| browser-use     | `job-scout` + `job-apply` kit links, the browser-use driver skill, the CLI (`uv tool uninstall`), and `~/.config/browser-harness`. Never your browser                                                        |
| Profile         | `${XDG_CONFIG_HOME:-~/.config}/job-kit` (+ host-default if different) and matching pointer files                                                                                                             |
| Cache           | Cached checkout at `JOB_KIT_HOME`                                                                                                                                                                            |
| **All**         | Aside + agents + browser-use + **profile** + cache                                                                                                                                                           |

Only kit-owned skill paths are removed. Foreign skills stay. A plan containing
profile or cache data requires typing `yes`; a plan of re-installable links takes
`[Y/n]`. `--yes` skips both, `--dry-run` prints the plan and stops.

`--only` selects a subset instead of positional targets — by channel (`aside`,
`agents`, `browser-use`), by Aside skill (`job-scout`, `job-apply`,
`job-resume-refine`, `job-profile-me`, `job-list`, `job-match`, `job-inbox`,
`job-humanize`, `job-profile-root`), or by agent home
(`claude`, `codex`, `grok`, `hermes`), plus `profile` and `cache`. An Aside skill subset
cannot be combined with `cache`: the unselected skill would still point at it.

```bash
bash scripts/uninstall.sh --only claude,job-scout --dry-run
```

Curl / non-interactive skills-only (does **not** delete profile data):

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall
# skills + kit cache:
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/remote.sh | bash -s -- uninstall --purge
```

`uninstall agents` and `uninstall browser-use` via remote still accept
`--skip-claude` / `--skip-codex` / `--skip-grok` / `--skip-hermes`. `--purge` is full-skills
uninstall only (refused on partial targets or while `CLAUDE_SKILLS` /
`ASIDE_SKILLS` narrow a channel).

## Work locally

Clone when you want to edit skills and see the change without reinstalling — the
agents channel symlinks, so edits in the checkout are live:

```bash
git clone https://github.com/rafaeelricco/job-kit.git
cd job-kit
bash scripts/install.sh   # interactive menu, or: all | aside | agents | browser-use
```

Prerequisites: Bash, plus the target for whichever channel you install — at
least one agent home (`~/.claude`, `~/.agents`, `~/.grok`, or `~/.hermes`; open that agent
once if missing), and an Aside account profile (`~/.aside/u/0`, including a
`skills` parent). For `browser-use`: an agent home, the `browser-use` CLI, a
Chromium-family browser you are signed into, and the driver skill the installer
places when the CLI is present — all local, no Browser Use account, no cloud
browser, no API key. The installer flags a missing CLI or browser and offers
the command that fixes it. Private clone: use whatever auth
your host requires (`gh repo clone rafaeelricco/job-kit`, HTTPS token, or SSH
remote).

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

| Path                       | Role                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `skill/job-scout/`         | Scout law, contracts, surfaces                                   |
| `skill/job-apply/`         | Apply law: queue, package, review, submit, record                |
| `skill/job-resume-refine/` | Tailor one page from profile Facts; one page + match-report      |
| `skill/job-profile-init/`  | Intake + templates for empty profiles                            |
| `skill/job-profile-me/`    | Show + edit search intent and boards                             |
| `skill/job-profile-root/`  | Resolve Profile root; never writes                               |
| `skill/job-list/`          | Read the profile's scout store; never writes                     |
| `skill/job-match/`         | Deep-rank scout dossiers; chat report only                       |
| `skill/job-inbox/`         | Gmail replies → lifecycle status on strong evidence              |
| `skill/job-stories/`       | Write and check the interview story deck                         |
| `skill/job-pitch/`         | Vetting script and work-experience bullets from the deck         |
| `skill/job-humanize/`      | Rewrite pass for already-drafted Summary, resume, or pitch prose |
| `scripts/install.sh`       | Single install: plan, confirm, apply (aside+agents+browser-use)  |
| `scripts/aside/`           | Aside lib + thin install wrapper                                 |
| `scripts/agents/`          | Agents lib + thin install wrapper                                |
| `scripts/uninstall.sh`     | Single uninstall: plan, confirm, apply                           |
| `scripts/remote.sh`        | Fetch to cache + install or uninstall (no clone)                 |

Search packs live in your profile at `data/search_packs.yaml`, emitted by
`/job-profile-init` and edited by `/job-profile-me packs`. One pack = one site;
`surface` is a label (`linkedin-jobs`, `open-web`, `social`, or another) — scout
opens that pack's `entry`.
`job-scout` requires the profile deck — no skill-local fallback.
`skill/job-inbox` cites `job-scout/references/contract-persistence.md` for the
dossier write transaction (Aside co-installs scout; agents-channel local copy
remains a known gap, unchanged by this edit).

## License

MIT
