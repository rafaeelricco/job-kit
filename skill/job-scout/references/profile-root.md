# Profile root — recovery (Aside / dual-home)

Ordered probe steps are authored in `../SKILL.md` and mirrored (lockstep-edit
marker) in job-tracker and job-profile-config SKILL.md. This file does not
redefine order.
Load when resolve STOPs or steps 2–4 fail.

## Why dual-home

Aside `$HOME` is often `…/.aside/runtime/home`, so this process may lack
`PROFILE_ROOT`. Host pointer + host-default probe (SKILL steps 3–4) bridge host
and Aside.

## Who writes pointers

Host-default path-convention root is `$HOST_HOME/.config/job-kit`. Skills always
probe that path in step 4 (after any XDG `JOB_KIT_CONFIG` candidate) — no
pointer required there, including when a coding agent has `XDG_CONFIG_HOME` set
elsewhere while Aside does not.

Activate writes host `$HOST_HOME/.config/profile-root` and mirrors into Aside
runtime home when present for every other location (non-default checkout **or**
`$XDG_CONFIG_HOME/job-kit` when that differs from the host default). Pointers
are checked before default dirs so an activated non-default profile wins.

## HOST_HOME

If `$HOME` ends with `/.aside/runtime/home`, strip that suffix; else use `$HOST_HOME`
env when set and absolute.

## Recovery (operators, in order)

1. Set `PROFILE_ROOT=/absolute/path/to/profile` for this Aside session (must pass probe
   **and** be readable inside Aside's FS sandbox).
2. Grant Aside filesystem access to that profile directory (macOS sandbox).
3. Prefer moving/creating the profile at `$HOST_HOME/.config/job-kit` so step 4
   resolves without pointers. Else re-run `/job-profile-init` with Activate **Yes**
   so host + Aside-runtime pointer files match the live profile (required for
   XDG-only or non-default paths).

## On STOP

Name each attempt: env, each pointer file + line, default `JOB_KIT_CONFIG`, walk start.
