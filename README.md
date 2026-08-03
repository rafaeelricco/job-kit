# job-kit

Finding a job is tedious, and you cannot do it at scale by hand. Two hard parts
show up every time: **where to look**, and **whether an opening actually fits**
your stack, seniority, geo, and work-auth constraints. Miss either and you
burn time on dead listings or applications that were never going to clear the
form filters.

Agents can run that loop for you: sweep the surfaces you care about, score fit
against a real profile, and draft applications without inventing facts. That
only works if the **procedure** (what the agent may do) is separate from the
**facts** (who you are, what you want, what you can prove).

**job-kit** is that procedure: three agent skills, installed with safe
symlinks, updated from this repo. Your salary band, work authorization,
experiences, and client evidence stay in a profile directory you control,
never in this tree.

- **One skill tree:** agents link here; no generated skill copies.
- **Safe re-runs:** exact links are no-ops; conflicts can be backed up or
  overridden.
- **Facts stay local:** `data/` and `private/` are not part of this repository.

## Quick Install

**Prerequisites:** Git. An agent that can load skills from a directory of
symlinks (or from the managed clone's `skill/` tree). A browser session is
required only when a skill needs to open live job pages.

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/install.sh | bash
```

Remote install uses managed mode and clones `~/.job-kit` by default.

## Local Checkout Install

Use local mode from the primary checkout to avoid a second clone:

```bash
bash scripts/install.sh --local
```

Local mode links skills directly from that checkout. It never clones or changes
Git state. Edits to an existing skill are live immediately. After adding or
removing a skill, reconcile global links with:

```bash
bash scripts/update.sh --local
```

The default clone is `~/.job-kit`. Use `--dir PATH` or `JOB_KIT_DIR` to override
it. Use `--yes` to back up conflicts without prompting, `--override` to remove
conflicts without backups. Pass `--link-dir PATH` once per destination skill
root (or set `JOB_KIT_LINK_DIRS` to a colon-separated list). Backup and
override modes cannot be used together.

These scripts only install skill symlinks. They do not create a profile, write
salary or work-auth data, or log into any service.

## Update

Managed update is authoritative and destructive inside the managed clone. It
fetches GitHub `main`, forces local `main` to that commit, and removes every
untracked, ignored, and nested-repository path with `git clean -ffdx`. Invoking
update is the authorization for this cleanup; `--yes` still means “back up
installer conflicts without prompting.”

Local update only reconciles links from the checkout that created the local
installation. It never fetches, pulls, checks out, resets, cleans, commits, or
changes the index or working tree.

Update never modifies profile checkouts or `~/.config/profile-root`.

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/update.sh | bash
```

## Uninstall

Local uninstall removes managed skill links while preserving the checkout:

```bash
bash scripts/uninstall.sh --local
```

Remote uninstall requires an explicit confirmation flag:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/uninstall.sh | bash -s -- --yes
```

Local interactive execution without `--yes` requires typing the exact token
`UNINSTALL`. Any other response cancels unchanged. A noninteractive run without
the flag exits with status 2.

Uninstall removes only verified links that point into this kit (and the managed
clone when uninstalling managed mode). Profile directories and
`~/.config/profile-root` are left alone unless you delete them yourself.

## Installed Paths

| Source | Destination (per `--link-dir`) |
| ------ | ------------------------------ |
| `skill/job-discovery` | `<link-dir>/job-discovery` |
| `skill/job-apply` | `<link-dir>/job-apply` |
| `skill/profile-scaffold` | `<link-dir>/profile-scaffold` |

If you pass no `--link-dir` and `JOB_KIT_LINK_DIRS` is unset, install uses the
defaults built into `scripts/install.sh` (see that file). Managed and local
modes cannot coexist; uninstall one before installing the other.

Managed clones must use the official GitHub HTTPS or SSH origin for
`rafaeelricco/job-kit` and be a standalone checkout at the path passed through
`--dir`. Run the installer as your normal user, not with `sudo`.

## Getting Started

### 1. Install the kit

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeelricco/job-kit/main/scripts/install.sh | bash
```

### 2. Create a profile

With an agent that loaded `profile-scaffold`:

```text
/profile-scaffold
```

The wizard asks for a target path, identity fields, and home market code. It
writes a data-only tree: `data/`, `private/`, `cv/`, and profile `scripts/`,
not a second copy of the skills.

### 3. Register the profile root

```bash
bash /path/to/your-profile/scripts/install.sh
```

This writes `~/.config/profile-root` to that absolute path so discovery and apply
resolve facts when the skills live under `~/.job-kit`.

### 4. Fill facts

Edit under the profile checkout at least:

- `data/candidate.yaml`: salary, work auth, routes, `home_market`
- `data/job_search.yaml`: titles, keywords, locations, blacklists
- `data/search_packs.yaml`: formulations the scout runs
- `data/basics.yaml`, `data/profiles.yaml`, `data/experiences.yml`, …
- `private/` when letters need project depth

### 5. Run the skills

```text
/job-discovery
/job-apply
```

**job-discovery** lists and ranks openings; it never applies or messages.
**job-apply** drafts and stages one application at a time; it stops at review
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

| Skill | Role |
| ----- | ---- |
| `job-discovery` | List-only job scout across every pack in `data/search_packs.yaml` |
| `job-apply` | Draft letter and form fields for one posting; stage only |
| `profile-scaffold` | Create a new data-only profile checkout |

## Layout

| Path | Role |
| ---- | ---- |
| `skill/job-discovery/` | Scout law, contracts, surfaces |
| `skill/job-apply/` | Apply law, draft contract |
| `skill/profile-scaffold/` | Wizard + templates for empty profiles |
| `scripts/` | install / update / uninstall |

## License

MIT
