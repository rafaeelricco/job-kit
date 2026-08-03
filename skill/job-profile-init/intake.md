# Intake

Named stages only — never number the questions or steps. Stages run in order.
Batch only independent enums (Route modes; Source modes when the harness
supports multi-option tools). Dependent branches stay sequential. Enumerables:
options, most-likely first, labelled **(Recommended)**, free-text escape.
Never treat silence as an answer.

## Route

Two outcomes; offer both.

- **Register existing**: directory holding both `data/candidate.yaml` and
  `data/job_search.yaml` (ignore any path under a `templates/` directory). Look
  where the operator points and where the session already is; do not sweep the
  filesystem. Choosing this **ends intake** — no Folder, Source, Identity, or
  Approve; no emit; no fill. Hand off to install only with that path as
  `<target>`.
- **Create new** → continue to Folder.

## Folder (create only)

Parent directory + profile folder name → absolute `<target>`.

- Recommend parent from session working directory, its parent, and the parent of
  any existing profile already found this session. Assume no layout convention.
- Propose a folder slug matching sibling naming in that parent; operator may
  rename. Do not treat the slug as display name (identity comes later).
- `<target>` must be absolute and must not exist or be an empty directory. Test
  before offering — never offer a path this law would refuse. Else STOP.

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
- **scaffold-only:** emit + install + next-steps; **skip fill**; state
  shells-only. Offer it; select only on the operator's explicit intent.

## Identity (create only)

Emit tokens: `display_name`, `email`, `linkedin_username`, `github_username`,
`home_market`.

### When Source is path or paste

1. Read the SoT. Build an identity **draft** only from printed facts (LinkedIn
   URL → username without `@`).
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

Present the plan: absolute `<target>`, identity tokens, Source mode (and paths
or paste/scaffold). Prefer the harness plan/approval step when one exists;
otherwise an explicit yes in chat. Silence is not approval. Corrections → re-ask
only the named fields → re-present. On approval → emit-tree (then fill, unless
scaffold-only). **No write before this yes.**
