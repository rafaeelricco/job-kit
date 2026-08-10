# Next steps (print after Activate or when Activate ask was No).

# Lines below (5 onward) are the literal print template — fill every {{…}} per

# activate.md step 9 and never leave unresolved placeholders, never invent

# CWD-relative kit `scripts/...` from a profile dir. Lines 1-4 (this comment

# block) are never printed. Empty optional bullets (GAPS_LINE / CV_LINE) are

# omitted entirely, not printed blank.

- {{ACTIVATE_NOTE}}
- {{KIT_INSTALL}}
  {{GAPS_LINE}}
- Day-2 edits: `/job-profile-config` — show your profile, change keywords,
  positions, locations, or boards without hand-editing YAML.
- Scout packs live in your profile (`data/search_packs.yaml`); tune formulations
  there or via `/job-profile-config packs`. The copy inside the job-scout skill is
  only a fallback and is overwritten on every kit reinstall.
  {{CV_LINE}}
- LinkedIn browser session must match `data/profiles.yaml` LinkedIn username.
- Additional details captured during init are preserved in
  `data/observations.yaml`; scout and application ignore this file.
- After a scout run persists, `/job-tracker` reads `scout/jobs/` back — dossiers
  and application status — without writing to it.
