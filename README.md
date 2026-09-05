<h1 align="center">
  <img src="https://r1cco.com/jobs/job-kit-logo.png" alt="Job Kit" width="480">
</h1>

Agent skills to find jobs, rank them against your profile, tailor your resume,
submit applications, and track replies in Gmail. Runs in Claude Code, Codex,
Grok, Hermes Agent, and [Aside Browser](https://aside.com).

Your profile and application records live in a directory you control, separate
from this repository. The [dashboard](https://r1cco.com/jobs/) opens the same
job records in your browser.

## Install

Open your coding agent or Aside at least once so its home directory exists.
Then run as your normal user:

```bash
curl -fsSL https://r1cco.com/install.sh | bash   # macOS / Linux / Git Bash
```

On Windows PowerShell:

```powershell
Invoke-RestMethod https://r1cco.com/install.ps1 -OutFile install.ps1
powershell -ExecutionPolicy Bypass -File install.ps1
```

The installer detects available targets. Windows supports coding agents and
browser-use; macOS also supports Aside. To select a channel or preview changes:

```bash
curl -fsSL https://r1cco.com/install.sh | bash -s -- agents
curl -fsSL https://r1cco.com/install.sh | bash -s -- all --dry-run
```

Channels are `all` (default), `agents`, `browser-use`, and `aside`.
The `browser-use` channel links `job-scout`, `job-apply`, `job-prep`,
`job-captcha-solver`, and their shared dependencies.
Browser tasks in coding agents need the local `browser-use` CLI, its driver
skill, and a Chromium-family browser. Follow the installer's setup guidance,
enable remote debugging at `chrome://inspect/#remote-debugging`, and sign in
to the sites you use.

Re-run the install command to install the latest published release. The installer
prints the installed version and verifies the release archive's SHA-256 checksum
before replacing the installed package. Installation downloads skills, templates,
and helper scripts without cloning the repository. The package lives at
`${XDG_DATA_HOME:-$HOME/.local/share}/job-kit` by default
(`%USERPROFILE%\.local\share\job-kit` on Windows). Keep this directory: installed
skills depend on it. Installation and updates leave your profile untouched.
`--dry-run` previews skill changes but still refreshes the package.

To install a specific published version:

```bash
curl -fsSL https://r1cco.com/install.sh | JOB_KIT_VERSION=v1.0.0 bash
```

```powershell
$env:JOB_KIT_VERSION = 'v1.0.0'
powershell -ExecutionPolicy Bypass -File install.ps1
Remove-Item Env:JOB_KIT_VERSION
```

`JOB_KIT_VERSION` defaults to `latest`. `JOB_KIT_HOME` overrides the installed
directory and `JOB_KIT_SLUG` selects a GitHub repository with compatible release
assets. The old `JOB_KIT_REF` selector is rejected when downloading; use a local
development checkout for unreleased changes.

When migrating an existing checkout or source archive, the installer keeps the
old directory, including local edits and untracked files, in a sibling
`job-kit.backup-*` directory and prints its path. Review and remove that backup
when you no longer need it; uninstall leaves it in place. Git worktrees and
submodules require manual relocation before migration. Existing cache symlinks
and junctions continue pointing at the same installed directory.

## Getting started

Run these skills in your agent:

1. `/job-profile-init` — create and activate a profile from your CV or register
   an existing profile. Profile setup requires a coding agent.
2. `/job-profile-me` — review your search preferences, search packs, and CV settings.
3. `/job-scout` — find openings from selected search packs or a site URL.
4. `/job-list` — review saved jobs and application statuses.
5. `/job-apply` — fill, submit, and record applications.
6. `/job-inbox` — check replies from a session with Gmail access.

**`/job-apply` submits without pausing for approval.** Use `/job-prep` to prepare
application packages without submitting. Scout finds and records jobs; inbox
reads mail and updates matching records.

Your profile defaults to `${XDG_CONFIG_HOME:-$HOME/.config}/job-kit`:
`data/` holds your facts, `cv/` holds base resumes, and `scout/` holds jobs and
application packages. Use `/job-profile-init` to activate another directory.
Aside needs filesystem access to that directory.

Resume tailoring requires a base CV PDF and its matching `.tex` source under
`cv/`. Use `/job-profile-me cvs` to select the base or disable per-vacancy tailoring.

## Documentation

Each skill contains its usage and detailed workflow:

| Skill                                                 | Purpose                                     |
| ----------------------------------------------------- | ------------------------------------------- |
| [job-profile-init](skill/job-profile-init/SKILL.md)   | Create or register a profile.               |
| [job-profile-me](skill/job-profile-me/SKILL.md)       | Edit profile, search, and CV settings.      |
| [job-scout](skill/job-scout/SKILL.md)                 | Find and rank live openings.                |
| [job-list](skill/job-list/SKILL.md)                   | Read saved jobs and statuses.               |
| [job-match](skill/job-match/SKILL.md)                 | Assess fit and get resume guidance.         |
| [job-prep](skill/job-prep/SKILL.md)                   | Prepare applications without submitting.    |
| [job-apply](skill/job-apply/SKILL.md)                 | Submit and record applications.             |
| [job-resume-refine](skill/job-resume-refine/SKILL.md) | Tailor a one-page resume.                   |
| [job-inbox](skill/job-inbox/SKILL.md)                 | Track Gmail replies.                        |
| [job-stories](skill/job-stories/SKILL.md)             | Build interview stories.                    |
| [job-pitch](skill/job-pitch/SKILL.md)                 | Draft video scripts and experience bullets. |
| [job-humanize](skill/job-humanize/SKILL.md)           | Refine prose while preserving claims.       |

Shared skills handle [profile lookup](skill/job-profile-root/SKILL.md) and
[job records](skill/job-store/SKILL.md).

## Uninstall

Remove installed skills while keeping Job Kit profile data and the cache.
These commands also remove the `browser-use` driver skill, CLI, and saved
state, even if you use them outside Job Kit:

```bash
curl -fsSL https://r1cco.com/install.sh | bash -s -- uninstall
```

On Windows, run the downloaded script with `uninstall`:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 uninstall
```

For the interactive removal menu, run `scripts/uninstall.sh` or
`scripts\uninstall.ps1` from the installed package. It shows the removal plan first.
**Choosing `all` in that menu also deletes profile data and the cache**, and
requires typing `yes`.

## Development

```bash
git clone https://github.com/rafaeelricco/job-kit.git
cd job-kit
bash scripts/install.sh
npm test
```

On Windows, use `powershell -ExecutionPolicy Bypass -File scripts\install.ps1`.
Coding-agent installs link to the checkout, so edits take effect there.
Re-run the installer to refresh Aside copies.

| Path                   | Contents                                            |
| ---------------------- | --------------------------------------------------- |
| [`skill/`](skill/)     | Skills, workflow references, and profile templates. |
| [`scripts/`](scripts/) | Installers, uninstallers, and test runner.          |
| [`tests/`](tests/)     | Repository checks.                                  |
| [`app/`](app/)         | Job dashboard.                                      |

## Releases

Merge a PR into `main` to start a release. Every merged PR, including documentation
changes, runs the full test suite and native installer checks on Linux, macOS,
and Windows before publication. Direct pushes and tag pushes do not publish
releases.

Versions increment automatically: patch by default, `release:minor` for a minor
bump, and `release:major` for a major bump. Major wins when both labels are present.
Create these optional repository labels before using them. When no stable tags
exist, the first automatic release is `v1.0.0`.

After verification, CI tags the tested commit, creates a draft GitHub Release,
uploads the runtime TAR and ZIP archives, `VERSION`, and `SHA256SUMS`, then
publishes it with generated release notes. Published assets are never overwritten.
A failed upload leaves a draft that can be recovered by rerunning the workflow.

A failed release blocks later release runs. Rerun the failed workflow after
repairing the problem, then rerun blocked workflows in ascending run-number order.
Reruns retain their original commit and reuse any reserved release version.

If an old commit cannot be released, explicitly abandon it by setting the
repository Actions variable `RELEASE_SKIP_THROUGH_RUN` to its Release workflow run
number, not its run ID. This skips that run and all earlier runs; it does not
publish them or bypass tests for subsequent releases. Existing tags and drafts
are not deleted.

To inspect a package locally:

```bash
python3 scripts/package_release.py --version v1.0.0 --output /tmp/job-kit-release
```

Both archives contain the same `job-kit/` tree. Packaging requires Python 3 and
Git; downloading and installing a release does not. Skill helpers keep their
existing runtime requirements.

## License

MIT
