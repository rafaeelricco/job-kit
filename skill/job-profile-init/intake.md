# Intake

Named stages only — never number the questions or steps. Stages run in order.
Batch only independent enums (Route modes; Source modes when the harness
supports multi-option tools). Dependent branches stay sequential. Enumerables:
options, most-likely first, labelled **(Recommended)**, free-text escape.
Never treat silence as an answer. Invent matrix + Hard refuses: `./fill.md` /
`SKILL.md` — do not restate full invent lists here.

## Existing Profile root (read-only pre-discovery)

Before offering the Route outcomes, read the machine pointer once. Reads are not
writes; nothing is registered here.

1. `HOST_HOME`: `$HOME` ending in `/.aside/runtime/home` → strip that suffix; else
   `HOST_HOME=$HOME`. Compute `HOST_DEFAULT=$HOST_HOME/.config/job-kit` and
   `JOB_KIT_CONFIG`: non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`;
   else `$HOST_DEFAULT`.
2. Read the one line of `$HOST_HOME/.config/profile-root` when readable. Absent or
   unreadable (sandbox `Operation not permitted`) → no pointer; continue.
   An optional discovery never blocks Route.
   Line resolves to a directory passing the two-file probe → offer that path as the
   **register existing** candidate, labelled already-active (pointer wins over
   path convention).
3. Else if `JOB_KIT_CONFIG` passes the two-file probe, treat it as the
   already-active candidate (recommended).
4. Pointer line resolves but fails the probe → say the pointer is **stale** and
   name it. Do not offer it as a register-existing candidate; carry the fact into
   the Activate ask, so the operator knows Yes replaces a stale pointer.

The discovered path is a recommendation, never a selection. No pointer file is
written before SKILL step 4. Do not sweep the filesystem — pointer + default
probes only.

## Route

Two outcomes; offer both.

- **Register existing**: directory holding both `data/candidate.yaml` and
  `data/job_search.yaml` (ignore any path under a `templates/` directory). Look
  where the operator points and where the session already is; do not sweep the
  filesystem. Choosing this **ends intake** — no Folder, Source, Identity, or
  Approve; no emit; no fill. Then run **Activate ask** (below) with that path as
  `<target>`, then SKILL step 4. Does not require `scripts/install.sh` on the
  profile.
- **Create new** → continue to Folder.

## Folder (create only)

Absolute `<target>` for the profile tree.

- **Default (Recommended):** `JOB_KIT_CONFIG` from pre-discovery
  (`${XDG_CONFIG_HOME:-$HOST_HOME/.config}/job-kit`). Single-profile layout:
  `data/`, `cv/`, `scripts/` live directly under that path.
- Operator may override with another absolute path (migration / advanced).
- `<target>` must be absolute and must not exist or be an empty directory. Test
  before offering — never offer a path this law would refuse. Else STOP.
- Do not treat the directory basename as display name (identity comes later).

After `<target>` is accepted: run **Activate ask** (below). Answer is stored for
SKILL step 4 after emit/fill — do not write pointer files before Approve/emit.

## Activate ask (create + register-existing)

Once absolute `<target>` is known, ask whether to make it the machine Profile
root (so scout/apply can resolve it). Enum; **Yes (Recommended)** first. Silence
is not yes.

Example prompt:

> Set `<target>` as the active Profile root on this machine? Scout/apply need
> that so they find your facts. When `<target>` is host-default
> `$HOST_HOME/.config/job-kit`, skills resolve it by path convention — no
> pointer file. XDG-only defaults and other paths write host
> `~/.config/profile-root` and, if Aside is installed, a mirror under Aside's
> runtime home. Optional session `PROFILE_ROOT` export for this coding agent only
> (Aside does not inherit env).

- **Yes (Recommended)** → step 4 will **Activate** (host-default confirm, or host
  pointer + Aside mirror for every other path + session `PROFILE_ROOT` export
  when possible).
- **No** → step 4 skips Activate **only** when `<target>` is **not** a path that
  skills probe by convention without a pointer. If `<target>` equals
  `JOB_KIT_CONFIG` (or canonical-equals `HOST_DEFAULT`), **No is not allowed**:
  presence of the two probe files would make the profile active immediately.
  Re-offer: **Yes (Recommended)**, or pick a different absolute non-default
  `<target>` and re-run Activate ask. Never emit under `JOB_KIT_CONFIG` after
  an Activate refusal.

Do not market this as “set env for Aside.” Aside does not inherit coding-agent
env; durable effect is host-default path convention and/or pointer files (host +
optional runtime mirror).

## Source (create only)

One stage. Accept mode and path payload in the **same turn** when possible.

Modes: **file path(s)** (Recommended) | **paste** | **scaffold-only**.

- **path(s):** absolute path(s) to CV / LinkedIn export PDF / notes. Multi-file
  OK (e.g. CV + preferences.md). Unreadable or missing → STOP (do not emit);
  re-ask with:
  > Need a source of truth (file path and/or paste). I will not invent salary,
  > visa, stack, or experience. Reply with path(s) or paste, then we continue.
- **paste:** the following user message is the SoT buffer. Chat memory alone is
  not SoT.
- **scaffold-only:** emit + Activate (if Yes) + next-steps; **skip fill**; state
  shells-only. Offer it; select only on the operator's explicit intent.

## Identity (create only)

Emit tokens: `display_name`, `email`, `linkedin_username`, `github_username`,
`home_market`.

### When Source is path or paste

1. Full-ingest the SoT into a session **SoT buffer** (paths: read each file once
   here; paste: the paste body is the buffer). Record a **Source key** (stable
   identity of this SoT: sorted absolute path(s), or a paste fingerprint). Build
   an identity **draft** only from the buffer (LinkedIn URL → username without
   `@`). Invent matrix + Hard refuses bind — extract only what is printed; never
   invent identity fields. Fill reuses this buffer when the Source key is
   unchanged (see `./fill.md` Source gate).
2. Present the draft. Ask **only** empty or conflicting fields — never re-ask
   fields the draft already settled unless the operator disputes them.
3. Required before Approve: `display_name`, `linkedin_username` (no `@`),
   `home_market` (short country/region label job-scout uses to bucket openings).
   `email` and `github_username` optional (`""` OK).
4. Recommend `home_market` only when SoT prints a clear location/country signal;
   never invent one.
5. Operator answers overwrite the draft for those fields.

### When Source is scaffold-only

No extract. Ask required fields (`display_name`, `linkedin_username`,
`home_market`); offer optional email and GitHub. No invented defaults. Attach
recommended answers only when grounded (e.g. name from conversation context the
operator just typed — not guessed from chat memory about prior sessions).

## Approve (create only)

Present the plan: absolute `<target>`, Activate Yes/No, identity tokens, Source
mode (and paths or paste/scaffold). Prefer the harness plan/approval step when
one exists; otherwise an explicit yes in chat. Silence is not approval.
Corrections → re-ask only the named fields → re-present. On approval → emit-tree
(then fill, unless scaffold-only). **No write before this yes.**
