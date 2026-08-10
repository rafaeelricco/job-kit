# Profile

Canonical facts for **job-scout** (list-only scout) and **job-application**
(draft + stage, never submit), read back by **job-tracker** (read-only).
Skills live in **job-kit**, not in this tree.

## Layout

| Folder   | What's in it                                                                                 |
| -------- | -------------------------------------------------------------------------------------------- |
| `data/`  | Canonical YAML about you. Edit here first.                                                   |
| `cv/`    | Compiled resume PDF(s) for attachments                                                       |
| `scout/` | Written by job-scout, read by job-tracker: `jobs/` per-job dossiers, `runs/` per-run records |

`data/` may mix `.yaml` and `.yml`.

## Register Profile root

`/job-profile-init` offers **Activate** at the end of the flow. Registration
runs only when the operator answers **Yes**. **No** leaves a data-only tree
(not allowed when the target is host-default / `JOB_KIT_CONFIG`, which would
auto-activate from the probe files alone).


To register manually, or to switch the active profile later, re-run
`/job-profile-init` against this path and answer **Activate: Yes**.

Host-default `~/.config/job-kit` is always skill-probed, and usually needs no
pointer. Two exceptions where Activate does register it, per `activate.md` — do
not delete the pointer in either, or this profile stops winning:

- a valid `$XDG_CONFIG_HOME/job-kit` profile also exists, so the pointer is what
  keeps host-default ahead of it;
- activation ran inside Aside, where host `$XDG_CONFIG_HOME` is not visible, so
  a later host session cannot re-outrank this profile.

Any other location — including `$XDG_CONFIG_HOME/job-kit` when it differs —
always gets `~/.config/profile-root` plus the Aside runtime mirror when present. To
remove this profile tree and kit skills, run the kit uninstaller from a job-kit
checkout: `bash scripts/uninstall.sh` (choose Profile or All). Path-convention
roots stay active until the tree is deleted.

## Fill before a useful run

1. Run `/job-profile-init`; it enters PLAN mode and asks every user-owned field.
   Source values and defaults require explicit confirmation, edits, or skips.
2. Review Gaps in the fill report; fix any empty fields scout needs.
3. `cv/en-us-resume.pdf` for job-application attachments when not already placed.
4. Search packs live in this profile at `data/search_packs.yaml`; tune formulations
   there or via `/job-profile-config packs`.
5. Free-form details are stored in `data/observations.yaml`.

## Rules

- Facts are read from files, never recalled from chat memory.
- job-scout is list-only; job-application stops at review and waits for an explicit yes.
- Never sign up, solve CAPTCHAs, or submit applications.
