# Profile

Canonical facts for **job-scout** (list-only scout) and **application-stage**
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

1. Fact-law files under `data/` (see application-stage Fact law table in the skill).
2. `data/search_packs.yaml` formulations to match your stack.
3. `private/` evidence + name map when client names must stay offline.
4. `cv/en-us-resume.pdf` (or tailored PDF) before apply attachments.

## Rules

- Facts are read from files, never recalled from chat memory.
- job-scout is list-only; application-stage stops at review and waits for an explicit yes.
- Never sign up, solve CAPTCHAs, or submit applications from the packs.
