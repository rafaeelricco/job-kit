# Intake

One free-text question at a time. Do not batch.

1. **Target path**: absolute. Must not exist, or directory empty. Else STOP.
2. **Display name** → `data/basics.yaml` `name`.
3. **Email** (optional; `""` OK) → `basics.email`.
4. **LinkedIn username** (required, no `@`). Empty → STOP.
5. **GitHub username** (optional).
6. **Home market code**: default `BR` → `data/candidate.yaml` `home_market`.
7. **Source of truth**: absolute path(s) to CV / LinkedIn export PDF / notes,
   and/or explicit "I will paste next". Empty, missing path, or unreadable →
   STOP with this follow-up (do not emit yet):
   > Need a source of truth (file path and/or paste). I will not invent salary,
   > visa, stack, or experience. Reply with path(s) or paste, then we continue.
   Accept multi-file (e.g. CV + preferences.md). "Scaffold only" is allowed only
   when the user says that exact intent — then emit + next-steps, **skip fill**,
   and state the profile is shells-only.
8. Print identity + SoT summary → wait for explicit confirm → emit-tree
   (then fill, unless scaffold-only).
