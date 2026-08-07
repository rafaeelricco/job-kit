# Profile

Canonical facts for **job-scout** (list-only scout) and **job-application**
(draft + stage, never submit). Skills live in **job-kit**, not in this tree.

## Layout

| Folder     | What's in it                               |
| ---------- | ------------------------------------------ |
| `data/`    | Canonical YAML about you. Edit here first. |
| `scripts/` | Register this checkout as Profile root     |
| `cv/`      | Compiled resume PDF(s) for attachments     |

`data/` may mix `.yaml` and `.yml`.

## Register Profile root

`/job-profile-init` registers this checkout automatically at the end of the flow.

To register manually, or to switch the active profile later:

```bash
bash scripts/install.sh          # register (fails if another profile is active)
bash scripts/install.sh --yes    # switch from another profile to this one
```

Writes `~/.config/profile-root` to this directory so scout and apply resolve
`data/*` correctly.

## Fill before a useful run

1. Prefer `/job-profile-init` with a source of truth so the agent fills `data/*`
   (never invents salary/visa/stack).
2. Review Gaps in the fill report; fix any empty fields scout needs.
3. `cv/en-us-resume.pdf` for job-application attachments when not already placed.
4. Search packs live in this profile at `data/search_packs.yaml`; tune formulations
   there or via `/job-profile-config packs`.

## Rules

- Facts are read from files, never recalled from chat memory.
- job-scout is list-only; job-application stops at review and waits for an explicit yes.
- Never sign up, solve CAPTCHAs, or submit applications.
