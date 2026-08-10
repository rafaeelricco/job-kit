# Next steps (print after Activate or when Activate ask was No; inject Gaps +

# notes + kit install)

# Fill every {{…}} per activate.md step 9 — never leave placeholders,

# never invent CWD-relative kit `scripts/...` from a profile dir.

0. {{ACTIVATE_NOTE}}
1. {{KIT_INSTALL}}
2. Resolve remaining Gaps from the fill report (if any): {{GAPS_OR_NONE}}.
3. Day-2 edits: `/job-profile-config` — show your profile, change keywords,
   positions, locations, or boards without hand-editing YAML.
4. Scout packs live in your profile (`data/search_packs.yaml`); tune formulations
   there or via `/job-profile-config packs`. The copy inside the job-scout skill is
   only a fallback and is overwritten on every kit reinstall.
5. If CV not placed: add `cv/en-us-resume.pdf` before job-application attachments.
6. LinkedIn browser session must match `data/profiles.yaml` LinkedIn username.
7. Additional details captured during init are preserved in
   `data/observations.yaml`; scout and application ignore this file.
8. After a scout run persists, `/job-tracker` reads `scout/` back — dossiers,
   run reports, and application status — without writing to it.
