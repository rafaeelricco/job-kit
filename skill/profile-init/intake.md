# Intake

One free-text question at a time. Do not batch.

1. **Target path**: absolute. Must not exist, or directory empty. Else STOP.
2. **Display name** → `data/basics.yaml` `name`.
3. **Email** (optional; `""` OK) → `basics.email`.
4. **LinkedIn username** (required, no `@`). Empty → STOP.
5. **GitHub username** (optional).
6. **Home market code**: default `BR` → `data/candidate.yaml` `home_market`.
7. Print summary → wait for explicit confirm → proceed to emit-tree.
