# Next steps (print after fill; inject remaining Gaps)

0. Coding agent: `bash scripts/agents/install.sh` (job-profile-init). Aside (scout/apply): `bash scripts/aside/install.sh` from the kit checkout.
1. Resolve remaining Gaps from the fill report (if any): {{GAPS_OR_NONE}}.
2. Confirm `data/search_packs.yaml` still matches intent (scout runs every pack in file).
   `impl` stems must match job-scout references (`surface-linkedin-jobs`, `surface-open-web`, …).
3. `private/` is intentionally empty this flow; add name-map / impact later when letters need client depth.
4. If CV not placed: add `cv/en-us-resume.pdf` before job-application attachments.
5. Run `bash scripts/install.sh` if not already (writes `~/.config/profile-root`).
6. LinkedIn browser session must match `data/profiles.yaml` LinkedIn username.
