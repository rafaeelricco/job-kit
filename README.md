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

This repo is the procedure: three agent skills, installed with safe
symlinks into [Aside Browser](https://aside.com). Salary band, work
authorization, experience, and client evidence stay in a profile
directory you control, never in this tree.

- **One skill tree:** Aside links here; no generated skill copies.
- **Safe re-runs:** exact links are no-ops; foreign conflicts fail unless
  you pass `--force`.
- **Facts stay local:** `data/` and `private/` are not part of this repository.

## Install (Aside only)

**Prerequisites:** Bash, Git, Aside Browser with an account profile
(default `~/.aside/u/0`).

From a job-kit checkout:

```bash
bash scripts/aside/install.sh
```

Links `skill/{job-discovery,job-apply,profile-scaffold}` into
`~/.aside/u/0/skills/user/` as absolute symlinks. Idempotent when links
already match. Foreign conflicts fail; pass `--force` to replace them.

```bash
ASIDE_ACCOUNT=1 bash scripts/aside/install.sh
ASIDE_SKILLS_USER=/path/to/skills/user bash scripts/aside/install.sh
bash scripts/aside/install.sh --force
```

These scripts only install skill symlinks. They do not create a profile,
write salary or work-auth data, or log into any service.

## Update

`git pull` in the checkout, then re-run install (idempotent re-link).

Update never modifies profile checkouts or `~/.config/profile-root`.

## Uninstall

```bash
bash scripts/aside/uninstall.sh
```

Removes only symlinks that point at this kit’s `skill/*` trees. Leaves other
Aside skills, profile checkouts, and `~/.config/profile-root` alone.

## Installed Paths

| Source                   | Destination                                 |
| ------------------------ | ------------------------------------------- |
| `skill/job-discovery`    | `~/.aside/u/0/skills/user/job-discovery`    |
| `skill/job-apply`        | `~/.aside/u/0/skills/user/job-apply`        |
| `skill/profile-scaffold` | `~/.aside/u/0/skills/user/profile-scaffold` |

Override the destination root with `ASIDE_SKILLS_USER` or `ASIDE_ACCOUNT`.
Run the installer as your normal user, not with `sudo`.

## Getting Started

### 1. Install the kit into Aside

```bash
bash scripts/aside/install.sh
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
resolve facts when the skills are linked into Aside.

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

| Skill              | Role                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `job-discovery`    | List-only job scout across every pack in `data/search_packs.yaml` |
| `job-apply`        | Draft letter and form fields for one posting; stage only          |
| `profile-scaffold` | Create a new data-only profile checkout                           |

## Layout

| Path                      | Role                                  |
| ------------------------- | ------------------------------------- |
| `skill/job-discovery/`    | Scout law, contracts, surfaces        |
| `skill/job-apply/`        | Apply law, draft contract             |
| `skill/profile-scaffold/` | Wizard + templates for empty profiles |
| `scripts/aside/`          | Aside install / uninstall             |

## License

MIT
