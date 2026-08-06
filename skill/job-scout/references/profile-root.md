# Profile root — recovery (Aside / dual-home)

Ordered probe steps live only in `../SKILL.md`. This file does not redefine order.
Load when resolve STOPs or steps 2–3 fail.

## Why dual-home

Aside `$HOME` is often `…/.aside/runtime/home`. Coding-agent `export PROFILE_ROOT`
from `/job-profile-init` does not appear here unless Aside (or the operator) set it
for **this** process.

## Who writes pointers

`/job-profile-init` Activate (or profile `scripts/install.sh`) writes host
`$HOST_HOME/.config/profile-root` and mirrors into Aside runtime home when present.
Runtime mirror is why sandboxed `$HOME` often hits step 2.

## HOST_HOME

If `$HOME` ends with `/.aside/runtime/home`, strip that suffix; else use `$HOST_HOME`
env when set and absolute.

## Recovery (operators, in order)

1. Set `PROFILE_ROOT=/absolute/path/to/profile` for this Aside session (must pass probe
   **and** be readable inside Aside's FS sandbox).
2. Grant Aside filesystem access to that profile directory (macOS sandbox).
3. Re-run `/job-profile-init` with Activate **Yes** (or profile `scripts/install.sh`)
   so host + Aside-runtime pointer files match the live profile.
4. Do **not** tell operators that bare `bash scripts/install.sh` from Aside CWD alone
   fixes a missing host pointer without a real profile path.

## On STOP

Name each attempt: env, each pointer file + line, walk start.
