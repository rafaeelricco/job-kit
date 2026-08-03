# Profile

Canonical facts for **job-scout** (list-only scout) and **job-application**
(draft + stage, never submit). Skills live in **job-kit**, not in this tree.

## Layout

| Folder     | What's in it                                         |
| ---------- | ---------------------------------------------------- |
| `data/`    | Canonical YAML about you. Edit here first.           |
| `private/` | Confidential interview prep. Client names only here. |
| `scripts/` | Register this checkout as Profile root               |
| `cv/`      | Compiled resume PDF(s) for attachments               |

`data/` may mix `.yaml` and `.yml`.

## Register Profile root

From this checkout root (after job-kit is installed):

```bash
bash scripts/install.sh
```

Writes `~/.config/profile-root` to this directory so scout and apply resolve
`data/*` correctly.

## Fill before a useful run

1. Prefer `/job-profile-init` with a source of truth so the agent fills `data/*` and
   confirms search packs (never invents salary/visa/stack).
2. Review Gaps in the fill report; fix any empty fields scout needs.
3. `private/` is optional later (client depth for letters); not required for scout.
4. `cv/en-us-resume.pdf` for job-application attachments when not already placed.

## Rules

- Facts are read from files, never recalled from chat memory.
- job-scout is list-only; job-application stops at review and waits for an explicit yes.
- Never sign up, solve CAPTCHAs, or submit applications from the packs.
