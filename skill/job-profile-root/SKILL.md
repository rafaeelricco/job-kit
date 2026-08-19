---
name: job-profile-root
description: "Read this when you need the absolute Profile root for any job-* skill. Use when another job skill says to load job-profile-root, or the user asks where is my profile / profile root / which job-kit folder. Prints one path or STOPs. Never writes. Never loads Fact YAML. Not for creating a profile (job-profile-init) or editing search config (job-profile-me)."
---

# Job profile root

Sole home of the Profile-root probe and order. Callers do not restate these steps.

Print the absolute path before returning. STOP if none. Do not invent a path.

**Probe** (must all pass for a candidate dir): directory exists and is readable;
contains `data/candidate.yaml` and `data/job_search.yaml`. Unreadable dir
(sandbox `Operation not permitted`, missing path) → treat as fail for that
candidate; try the next step.

1. `$PROFILE_ROOT` if set and probe passes.
2. File `$HOME/.config/profile-root` (one absolute path line); probe if non-empty.
3. **Aside dual-home pointer:** if `$HOME` is exactly or ends with
   `/.aside/runtime/home`, compute host `HOST_HOME` (strip suffix, else
   `$HOST_HOME` env if absolute) and read `$HOST_HOME/.config/profile-root`;
   probe when not already tried. Explicit Activate/install wins over path
   convention so a non-default active profile is not shadowed by residual
   files under the default config dir.
4. **Default config dirs** (probe each not already tried):
   - `JOB_KIT_CONFIG`: non-empty `$XDG_CONFIG_HOME` → `$XDG_CONFIG_HOME/job-kit`,
     else `$HOME/.config/job-kit`.
   - **Host-default fallback:** `$HOST_HOME/.config/job-kit` where `HOST_HOME`
     is from step 3 when dual-home, else strip `/.aside/runtime/home` from
     `$HOME` or use `$HOME`. Probe when that path differs from `JOB_KIT_CONFIG`.
     Always probe host-default so a profile there stays resolvable across Aside
     (often no XDG) and coding agents (may set XDG elsewhere) without a pointer.
5. Walk session CWD upward until probe passes.
6. else STOP. Name each attempt (env, each pointer file + line, each default
   config path, walk start), then
   point at `job-profile-init` (**create new**, or **register existing** with
   Activate = Yes). Load `./references/flow-recover-root.md` on STOP or
   step 2–4 fail. Never scaffold a profile from here.

Return: `Profile root: {absolute path}`. Caller resolves its own `data/*` /
`scout/` against that path.

## References

- Recovery: `./references/flow-recover-root.md` (dual-home; not step SSOT)
